import {
    Duration
} from './Duration';

function format(ms: number, template: string) {
    let duration = new Duration(ms);
    return duration.format(template);
}

export {
    Duration as default,
    format
};
export { UnitName } from './Duration';
export { IgnoreType } from './formatter';
