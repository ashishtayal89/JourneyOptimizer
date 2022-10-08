let flowChart = function (
  canvas,
  grab,
  release,
  snapping,
  rearrange,
  spacing_x,
  spacing_y
) {
  //#region Default Props
  if (!grab) {
    grab = function () {};
  }
  if (!release) {
    release = function () {};
  }
  if (!snapping) {
    snapping = function () {
      return true;
    };
  }
  if (!rearrange) {
    rearrange = function () {
      return false;
    };
  }
  if (!spacing_x) {
    spacing_x = 40;
  }
  if (!spacing_y) {
    spacing_y = 60;
  }
  //#endregion

  //#region Polyfill
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      let el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }
  //#endregion

  //#region Callback wrapper
  function blockGrabbed(block) {
    grab(block);
  }

  function blockReleased(block) {
    release(block);
  }

  function blockSnap(drag, first, parent) {
    return snapping(drag, first, parent);
  }

  function beforeDelete(drag, parent) {
    return rearrange(drag, parent);
  }
  //#endregion

  //#region Core logic
  (function () {
    //#region Variables
    let blocks = [];
    let canvas_div = canvas;
    let absx = 0;
    let absy = 0;
    let active = false;
    let paddingx = spacing_x;
    let paddingy = spacing_y;
    let drag, dragx, dragy, dragId;
    let mouse_x, mouse_y;
    let originalNode;
    //#endregion

    //#region Init Canvas Abs x/y
    if (
      window.getComputedStyle(canvas_div).position === "absolute" ||
      window.getComputedStyle(canvas_div).position === "fixed"
    ) {
      absx = canvas_div.getBoundingClientRect().left;
      absy = canvas_div.getBoundingClientRect().top;
    }
    //#endregion

    //#region Create indicator element
    let el = document.createElement("DIV");
    el.classList.add("indicator");
    el.classList.add("invisible");
    canvas_div.appendChild(el);
    //#endregion

    //#region setMouseXandY
    function setMouseXandY(event) {
      if (event.targetTouches) {
        mouse_x = event.changedTouches[0].clientX;
        mouse_y = event.changedTouches[0].clientY;
      } else {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
      }
    }
    //#endregion

    //#region isInCanvas
    function isInCanvas() {
      return (
        drag.getBoundingClientRect().top + window.scrollY >
          canvas_div.getBoundingClientRect().top + window.scrollY &&
        drag.getBoundingClientRect().left + window.scrollX >
          canvas_div.getBoundingClientRect().left + window.scrollX
      );
    }
    //#endregion

    //#region flowChart event handlers
    flowChart.beginDrag = function (event) {
      setMouseXandY(event);

      //#region Create a new Draggable node and set left and top
      // Not right click and select create-flowChart
      if (event.which !== 3 && event.target.closest(".create-flowChart")) {
        //#region Create new node
        originalNode = event.target.closest(".create-flowChart");
        let newNode = originalNode.cloneNode(true);
        newNode.classList.add("block");
        newNode.classList.remove("create-flowChart");
        const value = blocks.length;
        newNode.innerHTML +=
          "<input type='hidden' name='blockid' class='blockid' value='" +
          value +
          "'>";
        drag = newNode;
        drag.classList.add("dragging");
        dragId = drag.querySelector(".blockid").value;
        dragx = mouse_x - originalNode.getBoundingClientRect().left;
        dragy = mouse_y - originalNode.getBoundingClientRect().top;
        drag.style.left = mouse_x - dragx + "px";
        drag.style.top = mouse_y - dragy + "px";
        //#endregion

        //#region Make active, add new node to body and trigger callback
        active = true;
        document.body.appendChild(drag);
        blockGrabbed(originalNode);
        //#endregion
      }
      //#endregion
    };

    flowChart.endDrag = function (event) {
      if (event.which !== 3 && active) {
        blockReleased(originalNode);
        const indicator = document.querySelector(".indicator");
        if (!indicator.classList.contains("invisible")) {
          indicator.classList.add("invisible");
        }
        if (active) {
          drag.classList.remove("dragging");
        }
        if (active && blocks.length === 0 && isInCanvas()) {
          firstBlock("drop");
        } else if (active && blocks.length === 0) {
          removeSelection();
        } else if (active) {
          let blocko = blocks.map((a) => a.id);
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (checkAttach(block.id)) {
              active = false;
              if (blockSnap(drag, false, getBlockNode(block.id))) {
                snap(drag, i, blocko);
              } else {
                active = false;
                removeSelection();
              }
              break;
            } else if (i === blocks.length - 1) {
              active = false;
              removeSelection();
            }
          }
        }
      }
    };

    flowChart.moveBlock = function (event) {
      setMouseXandY(event);
      if (active) {
        drag.style.left = mouse_x - dragx + "px";
        drag.style.top = mouse_y - dragy + "px";
      }

      //#region logic to show indicator when block is near another block on mouse move
      if (active) {
        showIndicator();
      }
      //#endregion
    };
    //#endregion

    //#region showIndicator
    function showIndicator() {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const indicator = document.querySelector(".indicator");
        if (checkAttach(block.id)) {
          const blockNode = getBlockNode(block.id);
          blockNode.appendChild(indicator);
          indicator.style.left = block.width / 2 - 5 + "px";
          indicator.style.top = block.height + "px";
          indicator.classList.remove("invisible");
          break;
        } else if (i === blocks.length - 1) {
          if (!indicator.classList.contains("invisible")) {
            indicator.classList.add("invisible");
          }
        }
      }
    }
    //#endregion

    //#region removeSelection
    function removeSelection() {
      canvas_div.appendChild(document.querySelector(".indicator"));
      drag.parentNode.removeChild(drag);
    }
    //#endregion

    //#region getPositionFactors Different factor that need to be added before appending the dragged block
    function getPositionFactors() {
      return {
        xFactor: window.scrollX + canvas_div.scrollTop - absx,
        yFactor: window.scrollY + canvas_div.scrollTop - absy,
      };
    }
    //#endregion

    //#region firstBlock Executed when first block needs to be added
    function firstBlock(type) {
      if (type === "drop") {
        const { xFactor, yFactor } = getPositionFactors();
        blockSnap(drag, true, undefined);
        active = false;
        drag.style.top = drag.getBoundingClientRect().top + yFactor + "px";
        drag.style.left = drag.getBoundingClientRect().left + xFactor + "px";
        canvas_div.appendChild(drag);
        blocks.push({
          parent: -1,
          childwidth: 0,
          id: parseInt(dragId),
          x:
            drag.getBoundingClientRect().left +
            xFactor +
            drag.getBoundingClientRect().width / 2,
          y:
            drag.getBoundingClientRect().top +
            yFactor +
            drag.getBoundingClientRect().height / 2,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height),
        });
      }
    }
    //#endregion

    //#region drawArrow to draw the arrow
    function drawArrow(arrow, x, y, id) {
      const block = blocks.filter((a) => a.id === id)[0];
      if (x < 0) {
        canvas_div.innerHTML +=
          '<div class="arrowblock"><input type="hidden" class="arrowid" value="' +
          dragId +
          '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' +
          (block.x - arrow.x + 5) +
          " 0L" +
          (block.x - arrow.x + 5) +
          " " +
          paddingy / 2 +
          "L5 " +
          paddingy / 2 +
          "L5 " +
          y +
          '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' +
          (y - 5) +
          "H10L5 " +
          y +
          "L0 " +
          (y - 5) +
          'Z" fill="#C5CCD0"/></svg></div>';
        getArrowNode(dragId).style.left =
          arrow.x -
          5 -
          (absx + window.scrollX) +
          canvas_div.scrollLeft +
          canvas_div.getBoundingClientRect().left +
          "px";
      } else {
        canvas_div.innerHTML +=
          '<div class="arrowblock"><input type="hidden" class="arrowid" value="' +
          dragId +
          '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' +
          paddingy / 2 +
          "L" +
          x +
          " " +
          paddingy / 2 +
          "L" +
          x +
          " " +
          y +
          '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' +
          (x - 5) +
          " " +
          (y - 5) +
          "H" +
          (x + 5) +
          "L" +
          x +
          " " +
          y +
          "L" +
          (x - 5) +
          " " +
          (y - 5) +
          'Z" fill="#C5CCD0"/></svg></div>';
        getArrowNode(dragId).style.left =
          block.x -
          20 -
          (absx + window.scrollX) +
          canvas_div.scrollLeft +
          canvas_div.getBoundingClientRect().left +
          "px";
      }
      getArrowNode(dragId).style.top =
        block.y +
        block.height / 2 +
        canvas_div.getBoundingClientRect().top -
        absy +
        "px";
    }
    //#endregion

    //#region updateArrow
    function updateArrow(arrow, x, y, children) {
      const arrowNode = getArrowNode(children.id);
      const block = blocks.filter((id) => id.id === children.parent)[0];
      if (x < 0) {
        arrowNode.style.left =
          arrow.x -
          5 -
          (absx + window.scrollX) +
          canvas_div.getBoundingClientRect().left +
          "px";
        arrowNode.innerHTML =
          '<input type="hidden" class="arrowid" value="' +
          children.id +
          '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' +
          (block.x - arrow.x + 5) +
          " 0L" +
          (block.x - arrow.x + 5) +
          " " +
          paddingy / 2 +
          "L5 " +
          paddingy / 2 +
          "L5 " +
          y +
          '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' +
          (y - 5) +
          "H10L5 " +
          y +
          "L0 " +
          (y - 5) +
          'Z" fill="#C5CCD0"/></svg>';
      } else {
        arrowNode.style.left =
          block.x -
          20 -
          (absx + window.scrollX) +
          canvas_div.getBoundingClientRect().left +
          "px";
        arrowNode.innerHTML =
          '<input type="hidden" class="arrowid" value="' +
          children.id +
          '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' +
          paddingy / 2 +
          "L" +
          x +
          " " +
          paddingy / 2 +
          "L" +
          x +
          " " +
          y +
          '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' +
          (x - 5) +
          " " +
          (y - 5) +
          "H" +
          (x + 5) +
          "L" +
          x +
          " " +
          y +
          "L" +
          (x - 5) +
          " " +
          (y - 5) +
          'Z" fill="#C5CCD0"/></svg>';
      }
    }
    //#endregion

    //#region snap
    function snap(drag, i, blocko) {
      canvas_div.appendChild(drag);
      let totalwidth = 0;
      let totalremove = 0;
      const siblings = blocks.filter((id) => id.parent === blocko[i]);
      const parent = blocks.filter((id) => id.id === blocko[i])[0];

      //#region calculate total width of siblings post drag is added to parent.
      for (let w = 0; w < siblings.length; w++) {
        let sibling = siblings[w];
        if (sibling.childwidth > sibling.width) {
          totalwidth += sibling.childwidth + paddingx;
        } else {
          totalwidth += sibling.width + paddingx;
        }
      }
      totalwidth += parseInt(window.getComputedStyle(drag).width);
      //#endregion

      //#region reposition siblings
      for (let w = 0; w < siblings.length; w++) {
        let sibling = siblings[w];
        if (sibling.childwidth > sibling.width) {
          totalremove += sibling.childwidth + paddingx;
        } else {
          totalremove += sibling.width + paddingx;
        }
      }
      //#endregion

      //#region set left and top of newly added block
      const dragLeft = parent.x - totalwidth / 2 + totalremove - window.scrollX;
      const dragTop = parent.y + parent.height / 2 + paddingy - window.scrollY;
      drag.style.left = dragLeft + "px";
      drag.style.top = dragTop + "px";
      //#endregion

      //#region add block to the blocks config
      blocks.push({
        childwidth: 0,
        parent: blocko[i],
        id: parseInt(dragId),
        x: dragLeft + parseInt(window.getComputedStyle(drag).width) / 2,
        y: dragTop + parseInt(window.getComputedStyle(drag).height) / 2,
        width: parseInt(window.getComputedStyle(drag).width),
        height: parseInt(window.getComputedStyle(drag).height),
      });
      //#endregion

      //#region draw the arrow to dragged block
      let arrowblock = blocks.filter((a) => a.id === parseInt(dragId))[0];
      let arrowx =
        arrowblock.x - blocks.filter((a) => a.id === blocko[i])[0].x + 20;
      let arrowy = paddingy;
      drawArrow(arrowblock, arrowx, arrowy, blocko[i]);
      //#endregion

      //#region to set the childwidth of each parent
      if (blocks.filter((a) => a.id === blocko[i])[0].parent !== -1) {
        let flag = false;
        let idval = blocko[i];
        while (!flag) {
          if (blocks.filter((a) => a.id === idval)[0].parent === -1) {
            flag = true;
          } else {
            let zwidth = 0;
            for (
              let w = 0;
              w < blocks.filter((id) => id.parent === idval).length;
              w++
            ) {
              let children = blocks.filter((id) => id.parent === idval)[w];
              if (children.childwidth > children.width) {
                if (
                  w ===
                  blocks.filter((id) => id.parent === idval).length - 1
                ) {
                  zwidth += children.childwidth;
                } else {
                  zwidth += children.childwidth + paddingx;
                }
              } else {
                if (
                  w ===
                  blocks.filter((id) => id.parent === idval).length - 1
                ) {
                  zwidth += children.width;
                } else {
                  zwidth += children.width + paddingx;
                }
              }
            }
            blocks.filter((a) => a.id === idval)[0].childwidth = zwidth;
            idval = blocks.filter((a) => a.id === idval)[0].parent;
          }
        }
      }
      //#endregion
      rearrangeMe();
      checkOffset();
    }
    //#endregion

    //#region checkOffset to prevent blocks moving out of the canvas to the left side of the screen
    function checkOffset() {
      let blocksX = blocks.map((a) => a.x);
      let widths = blocks.map((a) => a.width);
      let blocksLeft = blocksX.map(function (item, index) {
        return item - widths[index] / 2;
      });
      let offsetleft = Math.min.apply(Math, blocksLeft);
      if (
        offsetleft <
        canvas_div.getBoundingClientRect().left + window.scrollX - absx
      ) {
        for (let w = 0; w < blocks.length; w++) {
          const block = blocks[w];
          const parent = blocks.filter((a) => a.id === block.parent)[0];
          const leftFactor = 20;
          const updateX = block.x - offsetleft + leftFactor;
          const left = updateX - block.width / 2;
          const blockNode = getBlockNode(block.id);
          blockNode.style.left = left + "px";
          if (block.parent !== -1) {
            const arrowNode = getArrowNode(block.id);
            let arrowblock = block;
            let arrowx = arrowblock.x - parent.x;
            if (arrowx < 0) {
              arrowNode.style.left =
                arrowblock.x - offsetleft + leftFactor - 5 + "px";
            } else {
              arrowNode.style.left = parent.x - offsetleft + "px";
            }
          }
        }
        for (let w = 0; w < blocks.length; w++) {
          const block = blocks[w];
          const blockNode = getBlockNode(block.id);
          block.x =
            blockNode.getBoundingClientRect().left +
            getPositionFactors().xFactor +
            parseInt(window.getComputedStyle(blockNode).width) / 2 -
            20;
        }
      }
    }
    //#endregion

    //#region
    function getArrowNode(blockId) {
      return document.querySelector('.arrowid[value="' + blockId + '"]')
        .parentNode;
    }

    //#region
    function getBlockNode(blockId) {
      return document.querySelector(".blockid[value='" + blockId + "']")
        .parentNode;
    }

    //#region rearrangeMe
    // Repositions the blocks based on the width of its children
    // Updates the arrow
    function rearrangeMe() {
      let result = blocks.map((a) => a.parent);
      for (let z = 0; z < result.length; z++) {
        if (result[z] === -1) {
          z++;
        }
        let totalwidth = 0;
        let totalremove = 0;

        //#region set total child width of each parent
        for (
          let w = 0;
          w < blocks.filter((id) => id.parent === result[z]).length;
          w++
        ) {
          let children = blocks.filter((id) => id.parent === result[z])[w];
          if (blocks.filter((id) => id.parent === children.id).length === 0) {
            children.childwidth = 0;
          }
          if (children.childwidth > children.width) {
            if (
              w ===
              blocks.filter((id) => id.parent === result[z]).length - 1
            ) {
              totalwidth += children.childwidth;
            } else {
              totalwidth += children.childwidth + paddingx;
            }
          } else {
            if (
              w ===
              blocks.filter((id) => id.parent === result[z]).length - 1
            ) {
              totalwidth += children.width;
            } else {
              totalwidth += children.width + paddingx;
            }
          }
        }
        if (result[z] !== -1) {
          blocks.filter((a) => a.id === result[z])[0].childwidth = totalwidth;
        }
        //#endregion

        //#region set position of each block and update arrow
        for (
          let w = 0;
          w < blocks.filter((id) => id.parent === result[z]).length;
          w++
        ) {
          let children = blocks.filter((id) => id.parent === result[z])[w];
          const childDomElement = getBlockNode(children.id);
          const parentBlock = blocks.find((id) => id.id === result[z]);
          if (children.childwidth > children.width) {
            childDomElement.style.left =
              parentBlock.x -
              totalwidth / 2 +
              totalremove +
              children.childwidth / 2 -
              children.width / 2 -
              window.scrollX +
              "px";
            children.x =
              parentBlock.x -
              totalwidth / 2 +
              totalremove +
              children.childwidth / 2;
            totalremove += children.childwidth + paddingx;
          } else {
            childDomElement.style.left =
              parentBlock.x -
              totalwidth / 2 +
              totalremove -
              window.scrollX +
              "px";
            children.x =
              parentBlock.x - totalwidth / 2 + totalremove + children.width / 2;
            totalremove += children.width + paddingx;
          }

          //#region update arrows
          let arrowblock = blocks.filter((a) => a.id === children.id)[0];
          let arrowx =
            arrowblock.x -
            blocks.filter((a) => a.id === children.parent)[0].x +
            20;
          let arrowy = paddingy;
          updateArrow(arrowblock, arrowx, arrowy, children);
          //#endregion
        }
        //#endregion
      }
    }
    //#endregion

    //#region checkAttach Check if a block can be attached to another block
    function checkAttach(id) {
      const { x, y, width, height } = blocks.find((block) => block.id === id);
      const { xFactor, yFactor } = getPositionFactors();
      const xpos =
        drag.getBoundingClientRect().left +
        xFactor +
        parseInt(window.getComputedStyle(drag).width) / 2;
      const ypos = drag.getBoundingClientRect().top + yFactor;
      if (
        x - width / 2 - paddingx <= xpos &&
        xpos <= x + width / 2 + paddingx &&
        y - height / 2 - paddingy <= ypos &&
        ypos <= y + height / 2 + paddingy
      ) {
        return true;
      } else {
        return false;
      }
    }
    //#endregion

    //#region utils
    function hasParentClass(element, classname) {
      if (element.className) {
        if (element.className.split(" ").indexOf(classname) >= 0) return true;
      }
      return (
        element.parentNode && hasParentClass(element.parentNode, classname)
      );
    }
    //#endregion

    //#region Mouse and Touch event handler
    document.addEventListener("mousedown", flowChart.beginDrag);

    document.addEventListener("mouseup", flowChart.endDrag, false);

    document.addEventListener("mousemove", flowChart.moveBlock, false);
    //#endregion
  })();
  //#endregion
};
