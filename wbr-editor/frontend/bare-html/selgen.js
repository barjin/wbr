"use strict";
class SelectorGenerator {
    static isUniqueCss(selector, root) {
        if (!root) {
            return document.querySelectorAll(selector).length === 1;
        }
        return Array.from(root.querySelectorAll(selector))
            .filter((x) => (x.parentNode === root))
            .length === 1;
    }
    static grabElementFromPoint(x, y) {
        return document.elementFromPoint(x, y) || (() => {
            window.scrollTo(x, y);
            x -= window.pageXOffset;
            y -= window.pageYOffset;
            return document.elementFromPoint(x, y);
        })();
    }
    static GetSelectorStructural(element) {
        if (element.tagName === 'BODY') {
            return 'BODY';
        }
        if (element.id) {
            return `#${element.id}`;
        }
        let selector = element.tagName;
        if (element.parentElement && !SelectorGenerator.isUniqueCss(selector, element.parentNode)) {
            const idx = Array.from(element.parentElement.children).findIndex((child) => (child === element));
            selector += `:nth-child(${idx + 1})`;
        }
        if (element.parentElement) {
            return `${this.GetSelectorStructural(element.parentElement)} > ${selector}`;
        }
        throw new Error('DOM Tree malformed, orphaned element!');
    }
}
//# sourceMappingURL=selgen.js.map