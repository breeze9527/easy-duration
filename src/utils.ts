export function isSMPCharacter(char: string) {
    let charCode = char.charCodeAt(0);
    return charCode >= 0xD800 && charCode <= 0xDBFF;
}

export function mergeArray<T>(arr1: T[], arr2: T[]): T[] {
    let result = arr1.slice();
    for (let i = 0, l = arr2.length; i < l; i++) {
        let target = arr2[i];
        if (result.indexOf(target) === -1) {
            result.push(target);
        }
    }
    return result;
}

export function paddingInteger(str: string, len: number): string {
    let intergerPart = str.split('.')[0];
    let paddingLen = len - intergerPart.length;
    while (paddingLen > 0) {
        str = '0' + str;
        paddingLen--;
    }
    return str;
}

export function arrayInclude<T>(source: T[], target: T | T[]): boolean {
    target = target instanceof Array ? target : [target];
    for (let si = 0, sl = source.length; si < sl; si++) {
        for (let ti = 0, tl = target.length; ti < tl; ti++) {
            if (target[ti] === source[si]) {
                return true;
            }
        }
    }
    return false;
}

export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = 60 * MS_IN_SECOND;
export const MS_IN_HOUR = 60 * MS_IN_MINUTE;
export const MS_IN_DAY = 24 * MS_IN_HOUR;
export const MS_IN_WEEK = 7 * MS_IN_DAY;
