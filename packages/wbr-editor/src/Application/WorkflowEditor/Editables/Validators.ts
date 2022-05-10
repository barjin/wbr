/* eslint-disable import/prefer-default-export, no-new */

export function isValidHref(url: string) {
  try {
    return new URL(url).href === url;
  } catch (e) {
    return false;
  }
}

export function isValidURL(url: string) {
  try {
    return !!new URL(url);
  } catch (e) {
    return false;
  }
}

export function isValidSelector(selector: string) {
  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

export function isValidCode(code: string) {
  const AsyncConstructor = (async () => {}).constructor as any;
  try {
    new AsyncConstructor(code);
    return true;
  } catch (e: any) {
    return false;
  }
}

export function getSyntaxErrors(code: string) {
  const AsyncConstructor = (async () => {}).constructor as any;
  try {
    new AsyncConstructor(code);
    return '';
  } catch (e: any) {
    return e.message;
  }
}
