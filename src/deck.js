/**
 * <Deck
 *    vertical|horizontal
 *    loop
 *    swipe
 *    dura=1400
 *    factor=0.4
 *    current=2
 *    easing=function(currentTime/duration)||string
 *    onSwitching
 *    onSwitchDone
 *  >
 *  <Deck.Slide>
 *  </Deck.Slide>
 *
 *  <Deck.Slide>
 *  </Deck.Slide>
 * </Deck>
 *
 */
import React, { Component, Children } from 'react';
import ReactDOM from 'react-dom';
import Tween from './tween';
import cns from 'classnames';
import raf from 'raf';

import Slide from './slide';

import styles from './style.scss';

const SWIPE_DURA = 1400; // default transition duration
const SWIPE_ONSET = 6;
const SWIPE_FACTOR = 0.4;

const STATUS = {
  NORMAL: 0,
  FORWARDING_UP: 1,
  FORWARDING_DOWN: 2,
  SWIPE_STARTED: 3,
  SWIPING_UP: 4,
  SWIPING_DOWN: 5,
  SWIPE_FORWARDING_UP: 6,
  SWIPE_FORWARDING_DOWN: 7,
  SWIPE_CANCELED_UP: 8,
  SWIPE_CANCELED_DOWN: 9
};

class Deck extends Component {
  constructor(props, context) {
    super(props, context);
    let { current } = props;
    this.state = {current, prev: current + 1, status: STATUS.NORMAL};
    this.tween = new Tween();
    this.tween.ease(props.easing).duration(props.dura || 1200)
        .on('started', ::this.onSwitchStarted)
        .on('updating', ::this.onSwitching)
        .on('stopped', ::this.onSwitchStopped)
        .on('paused', ::this.onSwitchPaused)
        .on('done', ::this.onSwitchDone);
  }
  componentDidMount() {
    this.calcDimension();
    window.addEventListener('resize', ::this.calcDimension);
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.status === STATUS.SWIPE_STARTED) return false;
    return true;
  }
  componentWillReceiveProps(nextProps) {
    let status = this.state.status;
    if (status === STATUS.NORMAL) {
      let prev = this.state.current;
      let current = this.normalizeIndex(nextProps.current);
      if (prev !== current) {
        status = prev < current ? STATUS.FORWARDING_DOWN : STATUS.FORWARDING_UP;
        this.setState({prev, current, status});
        this.startTran(0, (prev < current ? -1 : 1) * (nextProps.horizontal ? this.state.width : this.state.height));
      }
    }
  }
  normalizeIndex(index) {
    let slidesCount = Children.count(this.props.children);
    return (index + slidesCount) % slidesCount;
  }
  calcDimension() {
    let dom = ReactDOM.findDOMNode(this);
    this.setState({
      width: dom.offsetWidth,
      height: dom.offsetHeight
    });
  }
  onSwitchStarted() {
    let callback = this.props.onSwitchStarted;
    callback && raf(() => callback.call(this, this.state));
  }
  onSwitching({distance, factor}) {
    this.setState({distance});
    let callback = this.props.onSwitching;
    callback && raf(() => callback.call(this, factor || Math.abs(distance) / (this.props.horizontal ? this.state.width : this.state.height), this));
  }
  onSwitchDone(props) {
    this.setState({distance: 0, status: STATUS.NORMAL});
    let callback = this.props.onSwitchDone;
    callback && raf(() => callback.call(this, this.state));
  }
  onSwitchPaused(props) {
    let callback = this.props.onSwitchPaused;
    callback && callback.call(this, this.state);
  }
  onSwitchStopped(props) {
    let callback = this.props.onSwitchStopped;
    callback && callback.call(this, this.state);
  }
  startTran(from, to) {
    this.tween.reset({distance: from}).to({distance: to}).start();
  }


  handleWheel(e) {
    let status = this.state.status;
    if (status !== STATUS.NORMAL || e.deltaY === 0) return;

    let { children: slides, loop, horizontal } = this.props;
    let prev = this.state.current, current = prev + (e.deltaY > 0 ? 1 : -1);
    let slidesCount = Children.count(slides);
    current = loop ? (current + slidesCount) % slidesCount : current;

    if (current >= 0 && current < slidesCount) {
      status = e.deltaY > 0 ? STATUS.SWIPE_FORWARDING_DOWN : STATUS.SWIPE_FORWARDING_UP;
      this.setState({prev, current, status});
      this.startTran(0, (status === STATUS.SWIPE_FORWARDING_DOWN ? -1 : 1) * (horizontal ? this.state.width : this.state.height));
    }
  }

  handleTouchStart(e) {
    let status = this.state.status;
    if (status === STATUS.SWIPE_FORWARDING_UP || status === STATUS.SWIPE_FORWARDING_DOWN) return;
    this.tween.stop();
    let touch = e.changedTouches[0];
    let x = this.props.horizontal ? touch.clientX : 0, y = this.props.vertical ? touch.clientY : 0;
    this.setState({x, y, status: STATUS.SWIPE_STARTED});
  }
  handleTouchMove(e) {
    e.preventDefault();
    let status = this.state.status;
    if (status !== STATUS.SWIPE_STARTED && status !== STATUS.SWIPING_UP && status !== STATUS.SWIPING_DOWN) return;
    let touch = e.changedTouches[0];
    let { prev, current, x, y, width, height, distance = 0 } = this.state;
    let { horizontal, vertical } = this.props;
    if (status === STATUS.SWIPE_STARTED && distance !== 0) {
      x = horizontal ? touch.clientX - distance : 0;
      y = vertical ? touch.clientY - distance : 0;
      this.setState({x, y});
    }
    let dx = this.props.horizontal ? touch.clientX - x : 0,
        dy = this.props.vertical ? touch.clientY - y : 0;
    let slidesCount = Children.count(this.props.children);
    distance = dx + dy;
    prev = (status === STATUS.SWIPE_STARTED ? current : prev) + (distance > 0 ? -1 : 1);
    prev = this.props.loop ? (prev + slidesCount) % slidesCount : prev;
    if (status === STATUS.SWIPE_STARTED) {
      this.setState({prev: current});
    }
    if (prev < 0 || prev >= slidesCount) {
      this.onSwitching({distance: 0});
      return;
    }

    status = distance < 0 ? STATUS.SWIPING_DOWN : STATUS.SWIPING_UP;
    this.setState({current: prev, status});
    this.onSwitching({distance, factor: Math.abs(distance) / (horizontal ? width : height)});
  }
  handleTouchEnd(e) {
    let status = this.state.status;
    if (status !== STATUS.SWIPING_UP && status !== STATUS.SWIPING_DOWN) {
      //this.status = STATUS.NORMAL;
      return;
    }
    let { horizontal, vertical, factor = SWIPE_FACTOR } = this.props;
    let { prev, current, width, height, distance } = this.state;
    let touch = e.changedTouches[0];
    let shouldForward = Math.abs(distance) / (horizontal ? width : height) > factor;
    if (!shouldForward) [current, prev] = [prev, current];
    status = !shouldForward ? (distance > 0 ? STATUS.SWIPE_CANCELED_UP : STATUS.SWIPE_CANCELED_DOWN) : (distance > 0 ? STATUS.SWIPE_FORWARDING_UP : STATUS.SWIPE_FORWARDING_DOWN);
    this.setState({prev, current, status});
    this.startTran(distance, (shouldForward ? (distance > 0 ? 1 : -1) : 0) * (horizontal ? width : height));
  }
  handleTouchCancel(e) {
    this.setState({status: STATUS.SWIPE_CANCELED});
  }

  setSlideStyle(factor) {
    let { prev, current, status, distance, width, height } = this.state;
    let { horizontal, vertical, loop, swipe } = this.props;
    let style = {},
        dx = horizontal ? distance + factor * width : 0,
        dy = vertical ? distance + factor * height : 0;
    style.WebkitTransform = style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    return style;
  }

  updateSlides() {
    let { children: slides, horizontal, vertical, loop } = this.props;
    let { prev, current, status } = this.state;
    let slidesCount = Children.count(slides), lastIndex = slidesCount - 1;
    let swipingUp = status === STATUS.SWIPING_UP,
        swipingDown = status === STATUS.SWIPING_DOWN,
        forwardingUp = status === STATUS.FORWARDING_UP,
        forwardingDown = status === STATUS.FORWARDING_DOWN,
        swipeForwardingUp = status === STATUS.SWIPE_FORWARDING_UP,
        swipeForwardingDown = status === STATUS.SWIPE_FORWARDING_DOWN,
        swipeCancelUp = status === STATUS.SWIPE_CANCELED_UP,
        swipeCancelDown = status === STATUS.SWIPE_CANCELED_DOWN,
        normal = status === STATUS.NORMAL;
    let slidesProps = Children.map(slides, (slide, index) => ({
      done: normal,
      key: index,
      [index < current ? 'before' : index === current ? 'current' : 'after']: true
    }));
    let prevSlideProps = slidesProps[prev], currentSlideProps = slidesProps[current];
    /*
    swipingUp && console.log('swipingUp');
    swipingDown && console.log('swipingDown');
    forwardingUp && console.log('forwardingUp');
    forwardingDown && console.log('forwardingDown');
    swipeForwardingUp && console.log('swipeForwardingUp');
    swipeForwardingDown && console.log('swipeForwardingDown');
    swipeCancelUp && console.log('swipeCancelUp');
    swipeCancelDown && console.log('swipeCancelDown');
    normal && console.log('normal');
    */

    loop = loop && (swipingUp || swipingDown || swipeForwardingUp || swipeForwardingDown || swipeCancelUp || swipeCancelDown);
    currentSlideProps.current = prevSlideProps.prev = true;

    if (prev !== current && status !== STATUS.NORMAL) {
      let prevFactor = 0;
      let currentFactor = current > prev ? 1 : -1;
      if (swipeCancelDown) {
        currentFactor = 0;
        prevFactor = 1;
      } else if (swipeCancelUp) {
        currentFactor = 0;
        prevFactor = -1;
      }
      if (loop) {
        if (swipingDown) {
          currentFactor = 1;
        } else if (swipingUp) {
          currentFactor = -1;
        } else if (swipeForwardingDown) {
          currentFactor = 1;
        } else if (swipeForwardingUp) {
          currentFactor = -1;
        }
      }
      prevSlideProps.style = this.setSlideStyle(prevFactor);
      currentSlideProps.style = this.setSlideStyle(currentFactor);
    }
    return slidesProps.map((props, index) => React.cloneElement(slides[index], props));
  }

  render() {
    let { children, current, vertical, horizontal, loop, swipe, className, ...props } = this.props;
    if (swipe) {
      props.onWheel = ::this.handleWheel;
      props.onTouchStart = ::this.handleTouchStart;
      props.onTouchMove = ::this.handleTouchMove;
      props.onTouchEnd = ::this.handleTouchEnd;
    }
    className = cns({
      [className]: !!className,
      'deck--horizontal': horizontal,
      'deck--vertical': vertical
    }, 'deck');
    return (
      <div className={className} {...props}>
        {this.updateSlides()}
      </div>
    );
  }

}
Deck.STATUS = STATUS;
Deck.Slide = Slide;
export default Deck;
