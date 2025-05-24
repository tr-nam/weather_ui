import React from 'react';
import styled from 'styled-components';

const Switch = ({onClick}) => {
  return (
    <StyledWrapper>
      <div>
        <input onChange={onClick} type="checkbox" id="checkbox" />
        <label htmlFor="checkbox" className="toggle">
          <div className="bar bg-gray-500 dark:bg-slate-200 bar--top" />
          <div className="bar bg-gray-500 dark:bg-slate-200 bar--middle" />
          <div className="bar bg-gray-500 dark:bg-slate-200 bar--bottom" />
        </label>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  #checkbox {
    display: none;
  }

  .toggle {
    position: relative;
    width: 30px;
    cursor: pointer;
    margin: auto;
    display: block;
    height: calc(4px * 3 + 11px * 2);
  }

  .bar {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: calc(4px / 2);
    color: inherit;
    opacity: 1;
    transition: none 0.35s cubic-bezier(.5,-0.35,.35,1.5) 0s;
  }

  /***** Spin Animation *****/

  .bar--top {
    bottom: calc(50% + 5px + 4px/ 2);
    transition-property: bottom,transform;
    transition-delay: calc(0s + 0.35s),0s;
  }

  .bar--middle {
    top: calc(50% - 4px/ 2);
    transition-property: opacity;
    transition-delay: calc(0s + 0.35s);
  }

  .bar--bottom {
    top: calc(50% + 5px + 4px/ 2);
    transition-property: top,transform;
    transition-delay: calc(0s + 0.35s),0s;
  }

  #checkbox:checked + .toggle .bar--top {
    bottom: calc(50% - 2px/ 2);
    transform: rotate(135deg);
    transition-delay: 0s,calc(0s + 0.35s);
  }

  #checkbox:checked + .toggle .bar--middle {
    opacity: 0;
    transition-duration: 0s;
    transition-delay: calc(0s + 0.35s);
  }

  #checkbox:checked + .toggle .bar--bottom {
    top: calc(50% - 4px/ 2);
    transform: rotate(225deg);
    transition-delay: 0s,calc(0s + 0.35s);
  }`;

export default Switch;
