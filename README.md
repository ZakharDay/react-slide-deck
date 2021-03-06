> A simple react component for swipe, tabs, carousel, one page scroll ...,
with animation hooks. tweening, tween callbacks. works on PC and touch devices

---

** NOTEICE: since 0.1.1, pass `swipe` prop to `Deck` only enable|disable swipe functionality, not including wheel control, which requires a seperated `wheel` prop **


## `npm i react-slide-deck --save`

---

# [Demo](http://output.jsbin.com/hexada)
also open on touch device, see the swipe effect

--

---
### For development
```
npm install
bower install
gulp dev
// then open localhost:3003
```

## build
```
gulp build
```

---

#### Usage:

```js

import React, { Component } from 'react';

import Deck from 'react-slide-deck';


class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = {current: 0, horizontal: true, swipe: true, factor: 0.3, loop: true};
  }
  change(event) {
    let target = event.target;
    let index = Array.prototype.indexOf.call(target.parentElement.children, target);

    this.setState({
      current: index
    });
  }
  onSwitchStarted({prev: current, current: next}) {
    console.log(`started to switch from ${current} to ${next}`);
  }
  onSwitching(progress, deck) {
    console.log(`switching on progress.`);
    console.log(progress, deck.state.distance);
  }
  onSwitchDone({prev, current}) {
    console.log(`switch finished, current slide index: ${current}`);
  }
  render() {
    return (
      <div>
        <Deck {...this.state} onSwitching={::this.onSwitching} onSwitchDone={::this.onSwitchDone}>
          <Deck.Slide className='bg-black'>
          1
          </Deck.Slide>
          <Deck.Slide className='bg-green'>
          2
          </Deck.Slide>
          <Deck.Slide className='bg-red'>
          3
          </Deck.Slide>
          <Deck.Slide className='bg-yellow'>
          4
          </Deck.Slide>
        </Deck>
        <ul className='indicators' onClick={::this.change}>
          <li>1</li>
          <li>2</li>
          <li>3</li>
          <li>4</li>
        </ul>
      </div>
    );
  }
}

```

---

```js
<Deck
  current // current slide index
  horizontal|vertical // direction for the slides
  wheel // can be control by wheel or not
  swipe // can swipe or not for touch devices
  animate // boolean, should apply animation for indicator click switch or not, see demo link
  factor // swipe distance used to determine whether to swipe forward or abort on touch devices.
         // if (swipeDistance / width(or height for vertical)) > factor, then will switch to next slide, otherwise return to the current slide.
  loop //  scroll down on the last Deck.Slide => transition to the first Deck.Slide.(first => last as well). only work when `swipe` is set
  dura // duration for slide transition, optional. default is 1400ms
  easing // `function|string` tweening easing function for transition between slides. see detail below,
  onSwitching // function(progress, deck) /*fired on every tweening transition. `deck` is the component instance of Deck, useful for accessing data like deck.status, deck.state.distance ...*/
  onSwitchDone // function({prev, current}) /*fired when slide transition is finished*/
  onSwitchStarted // function({prev:current, current:next}) /*fired before a tween transition started*/
  >
  <Deck.Slide> content </Deck.Slide>
  <Deck.Slide> content2 </Deck.Slide>
</Deck>
```

---
#### animation hooks
`Deck.Slide`
- `.slide--current` // current slide entered
- `.slide--current-entering` // current slide entering
- `.slide--before` // slides before current slide
- `.slide--after` // slides after current slide
- `.slide--prev` // the previous slide left
- `.slide--prev-leaving` // previous slide leaving

use these classes hook to do css animations, for example:
```css
.item {
  transition: all 1s ease;
}
.slide--current .item {
  transform: translateX(200px);
}
// when switch to the 3rd slide, the `.item` will be animated
```

---

`easing`:
  - `function(currentTime/duration)` a function used to do the tweening easing effect, take one argument
  - `string`, name of built in easing function. see `src/ease.js` for details

---

#### Note.

- it doesn't provide the slide indicators(usually for slides navigation), because it's hard to meet all needs.

- if you need slide indicators, do what you want, just provide the `current` slide index to `<Deck current={current}>`, it will take care of the transition
