type Props<T> = {
  [K in keyof T]?: T[K];
} & {
  bind?(node: T): void;
  listeners?: {
    [K in keyof HTMLElementEventMap]?: {
      listener: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any;
      options?: boolean | AddEventListenerOptions;
    };
  };
};

const generate = <K extends keyof HTMLElementTagNameMap>(tagName: K) => {
  return (props?: Props<HTMLElementTagNameMap[K]>, nodes?: Node[]) => {
    const e = document.createElement(tagName);
    if (nodes) e.replaceChildren(...nodes);
    if (props) {
      Object.entries(props)
        .filter(([key, _]) => key in e)
        .forEach(([key, value]) => ((e as any)[key] = value));
      if (props.bind) props.bind(e as any);
      if (props.listeners)
        Object.entries(props.listeners).forEach(([key, value]) =>
          e.addEventListener(key, value.listener as any, value.options),
        );
    }
    return e;
  };
};

export const frag = (...nodes: Node[]) => {
  const frag = document.createDocumentFragment();
  frag.replaceChildren(...nodes);
  return frag;
};

export const div = generate("div");
export const hr = generate("hr");
export const br = generate("br");
export const script = generate("script");
export const h1 = generate("h1");
export const h2 = generate("h2");
export const h3 = generate("h3");
export const p = generate("p");
export const form = generate("form");
export const label = generate("label");
export const input = generate("input");
export const ol = generate("ol");
export const ul = generate("ul");
export const li = generate("li");
export const span = generate("span");
export const button = generate("button");
