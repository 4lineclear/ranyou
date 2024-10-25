type IntoElem<T extends Node> = T | (() => T);

declare global {
  interface DocumentFragment {
    /**
     * Turns the fragment into an element
     */
    toElement<K extends keyof HTMLElementTagNameMap>(
      tagName: K,
      map?: (elem: HTMLElementTagNameMap[K]) => void,
      options?: ElementCreationOptions,
    ): HTMLElementTagNameMap[K];
    /**
     * Adds an element
     */
    add<T extends Node>(elem: IntoElem<T>, map?: (elem: T) => void): this;
  }
}
DocumentFragment.prototype.add = function add<T extends Node>(elem: IntoElem<T>, map?: (elem: T) => void) {
  if (typeof elem === 'function') {
    const e = elem();
    this.appendChild(e);
    map?.(e);
  } else {
    this.appendChild(elem);
    map?.(elem);
  }
  return this;
};

DocumentFragment.prototype.toElement = function toElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  map?: (elem: HTMLElementTagNameMap[K]) => void,
  options?: ElementCreationOptions,
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tagName, options);
  elem.appendChild(this);
  map?.(elem);
  return elem;
};

const frag = () => document.createDocumentFragment();
export default frag;
