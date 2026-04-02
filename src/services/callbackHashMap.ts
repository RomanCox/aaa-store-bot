export const callbackHashMap = new Map<string, string>();

export function setCallbackHash(hash: string, original: string) {
  callbackHashMap.set(hash, original);
}

export function getCallbackOriginal(hash: string) {
  return callbackHashMap.get(hash);
}