type Props<T> = {
  [K in keyof T]?: T[K];
} & {
  bind?(node: T): void;
};

const generate = <K extends keyof HTMLElementTagNameMap>(tagName: K) => {
  return (props?: Props<HTMLElementTagNameMap[K]>, nodes?: Node[]) => {
    const e = document.createElement(tagName);
    e.replaceChildren(...(nodes ?? []));
    if (props) {
      Object.entries(props)
        .filter(([key, _]) => key in e)
        .forEach(([key, value]) => ((e as any)[key] = value));
      if (props.bind) props.bind(e as any);
    }
    return e;
  };
};

export const inPlace = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props?: Props<HTMLElementTagNameMap[K]>,
  ...nodes: Node[]
) => {
  const e = document.createElement(tagName);
  e.replaceChildren(...nodes);
  if (props) {
    Object.entries(props)
      .filter(([key, _]) => key in e)
      .forEach(([key, value]) => ((e as any)[key] = value));
  }
  return e;
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
