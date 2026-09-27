type Attributes = Readonly<Record<string, string | number | boolean | undefined>>;

/**
 * Creates an element. Attributes set to false or undefined are left out; true sets an empty
 * attribute. Children are nodes or text.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    element.setAttribute(name, value === true ? "" : String(value));
  }
  element.append(...children);
  return element;
}
