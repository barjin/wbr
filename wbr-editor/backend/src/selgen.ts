/* eslint-disable max-len */

class SelectorGenerator {
  /**
     * Tests if the (CSS) selector targets unique element on the current page.
     * @param selector String with the generated selector
     * @param [root] - if specified, the uniqueness is tested only among this root's direct children.
     * @returns True if unique, false otherwise (the selector targets more than one element).
     */
  private static isUniqueCss(selector : string, root? : ParentNode | null) : boolean {
    if (!root) {
      return document.querySelectorAll(selector).length === 1;
    }
    // If we specify the root node, we are looking only at the direct children (css child combinator >).
    return Array.from(root.querySelectorAll(selector))
      .filter((x) => (x.parentNode === root))
      .length === 1;
  }

  /**
     * Grabs the topmost element on the specified coordinates.
     * If the coordinates are not in the current viewport, the page gets scrolled (the document.elementFromPoint would return null for out of screen elements).
     * @param x x click coordinate
     * @param y y click coordinate
     * @returns Topmost element on the specified coordinates.
     */
  static grabElementFromPoint(x: number, y: number) : (Element | null) {
    return document.elementFromPoint(x, y) || (() => {
      window.scrollTo(x, y);
      x -= window.pageXOffset;
      y -= window.pageYOffset;
      return document.elementFromPoint(x, y);
    })();
  }

  /**
     * Generates structural selector (describing element by its DOM tree location).
     * @param element Element being described.
     * @returns CSS-compliant selector describing the element's location in the DOM tree.
     */
  public static GetSelectorStructural(element : Element) : string {
    // Base conditions for the recursive approach.
    if (element.tagName === 'BODY') {
      return 'BODY';
    }
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = element.tagName;
    if (element.parentElement && !SelectorGenerator.isUniqueCss(selector, element.parentNode)) { // if selector is not unique among siblings, we count its position (ugly, but simple)
      const idx = Array.from(element.parentElement.children).findIndex((child) => (child === element));
      selector += `:nth-child(${idx + 1})`;
    }
    if (element.parentElement) {
      return `${this.GetSelectorStructural(element.parentElement)} > ${selector}`;
    }

    throw new Error('DOM Tree malformed, orphaned element!');
  }
}

(<any>window).SelectorGenerator = SelectorGenerator;
