import {
    compareFormatterOption,
    formatterGenerator,
    parsePattern,

    Formatter,
    FormatOptions,
    TemplateNodesParseResult
} from './formatter';
import {
    arrayInclude,

    MS_IN_DAY,
    MS_IN_HOUR,
    MS_IN_MINUTE,
    MS_IN_SECOND,
    MS_IN_WEEK
} from './utils';

export type UnitName = 'week' | 'day' | 'hour' | 'minute' | 'second';
export type DurationSegment = { [key in UnitName]?: number; };
export type UnitToken = 'w' | 'W' | 'd' | 'D' | 'H' | 'm' | 's';
interface TokenData {
    token: UnitToken | UnitToken[];
    name: UnitName;
    ms: number;
}

export const TOKENS: TokenData[] = [
    { token: ['w', 'W'], name: 'week', ms: MS_IN_WEEK },
    { token: ['d', 'D'], name: 'day', ms: MS_IN_DAY },
    { token: 'H', name: 'hour', ms: MS_IN_HOUR },
    { token: 'm', name: 'minute', ms: MS_IN_MINUTE },
    { token: 's', name: 'second', ms: MS_IN_SECOND }
];
export const TOKEN_REG = new RegExp(`((${TOKENS.map(({ token }) => typeof token === 'string' ? token : token.join('|')).join('|')})+)(?:\\.(\\2+))?`, 'g');
// result [outPut, intergerPart, unitToken, fractionalPart]
// HH.HHH => ['HH.HHH', 'HH', 'H', 'HHH']
export const TOKEN_MAP: { [key in UnitToken]?: UnitName } = {};
TOKENS.forEach(tokenData => {
    let tokens = tokenData.token;
    tokens = tokens instanceof Array ? tokens : [tokens];
    tokens.forEach(token => TOKEN_MAP[token] = tokenData.name);
});

export class Duration {
    static __templateCache: { [key: string]: TemplateNodesParseResult } = {};
    static __formatterCache: Array<{ options: FormatOptions; template: string, formatter: Formatter }> = [];
    static DefaultFormatOption: FormatOptions = {
        ignore: 'both'
    };

    constructor(public ms: number) { }

    normalize(tokens: UnitToken[]): DurationSegment {
        let result: DurationSegment = {};
        let rest = this.ms;
        let lastToken: TokenData | undefined;
        TOKENS.forEach((item, index) => {
            let targetToken = item.token;
            if (arrayInclude(tokens, targetToken)) {
                let tokenName = item.name;
                let num = Math.floor(rest / item.ms);
                rest -= num * item.ms;

                result[tokenName] = num;
                lastToken = item;
            }
        });
        if (lastToken) {
            result[lastToken.name]! += rest / lastToken.ms;
        }
        return result;
    }

    format(template: string, _options: Partial<FormatOptions> = Duration.DefaultFormatOption): string {
        let options = {
            ...Duration.DefaultFormatOption,
            ..._options
        };
        let parseResult = Duration.__templateCache[template];
        if (parseResult === undefined) {
            parseResult = Duration.__templateCache[template] = parsePattern(template);
        }
        let formatter: Formatter | undefined;
        Duration.__formatterCache.some(cache => {
            if (
                cache.template === template &&
                compareFormatterOption(options, cache.options)
            ) {
                formatter = cache.formatter;
                return true;
            } else {
                return false;
            }
        });
        if (formatter === undefined) {
            formatter = formatterGenerator(parseResult.nodes, options);
            Duration.__formatterCache.push({
                template,
                options,
                formatter
            });
        }
        let durationSegments = this.normalize(parseResult.tokens);
        return formatter!(durationSegments) || '';
    }

    weeks(round: boolean = false) {
        let num = this.ms / MS_IN_WEEK;
        return round ? Math.round(num) : num;
    }

    days(round: boolean = false) {
        let num = this.ms / MS_IN_DAY;
        return round ? Math.round(num) : num;
    }

    hours(round: boolean = false) {
        let num = this.ms / MS_IN_HOUR;
        return round ? Math.round(num) : num;
    }

    minutes(round: boolean = false) {
        let num = this.ms / MS_IN_MINUTE;
        return round ? Math.round(num) : num;
    }

    seconds(round: boolean = false) {
        let num = this.ms / MS_IN_SECOND;
        return round ? Math.round(num) : num;
    }
}

export default Duration;
