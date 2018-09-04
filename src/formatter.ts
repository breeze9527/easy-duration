import {
    parse as parseTemplate,

    ParseOption as PatternParseOption,
    TemplateLiteralNode,
    TemplateNode
} from './template';
import {
    mergeArray,
    paddingInteger
} from './utils';

import {
    DurationSegment,
    TOKEN_MAP,
    TOKEN_REG,
    TOKENS,
    UnitName,
    UnitToken
} from './Duration';

export type Formatter = (segments: DurationSegment) => string | null;
export type IgnoreType = 'head' | 'tail' | 'both' | 'force';
export interface FormatOptions {
    ignore: IgnoreType;
}

const TEMPLATE_PATTERN_OPTION: PatternParseOption = {
    escapeToken: '\\',
    pattern: {
        optional: {
            nested: true,
            delimiter: ['[', ']']
        },
        escape: {
            nested: false,
            disableEscape: true,
            delimiter: ['{', '}']
        }
    }
};

interface Token {
    type: 'token';
    name: UnitName;
    token: UnitToken;
    integerLength: number;
    fractionalLength: number;
}
interface Text {
    type: 'text';
    content: string;
}
interface OptionalGroup {
    type: 'optionalGroup';
    children: DurationTemplateNode[];
}
type DurationTemplateNode = Token | Text | OptionalGroup;

export interface TemplateNodesParseResult {
    tokens: UnitToken[];
    nodes: DurationTemplateNode[];
}

export function parsePattern(template: string) {
    let nodes = parseTemplate(template, TEMPLATE_PATTERN_OPTION);
    return parseTemplateNodes(nodes);
}

function parseTemplateNodes(nodes: TemplateNode[]): TemplateNodesParseResult {
    let tokens: TemplateNodesParseResult['tokens'] = [];
    let result: DurationTemplateNode[] = [];
    nodes.forEach(item => {
        if (item.type === 'pattern' && item.patternName === 'optional') {
            let childrenParsedResult = parseTemplateNodes(item.children);
            tokens = mergeArray(tokens, childrenParsedResult.tokens);
            result.push({
                type: 'optionalGroup',
                children: childrenParsedResult.nodes
            });
            return;
        }

        let lastNode = result.length ? result[result.length - 1] : null;
        if (
            item.type === 'pattern' && item.patternName === 'escape' ||
            item.type === 'escaped'
        ) {
            let content = item.type === 'pattern' ? (item.children[0] as TemplateLiteralNode).content : item.content;
            if (lastNode && lastNode.type === 'text') {
                lastNode.content += content;
            } else {
                result.push({
                    type: 'text',
                    content
                });
            }
            return;
        }

        if (item.type === 'raw') {
            let rawContent = item.content;
            let lastIndex = TOKEN_REG.lastIndex = 0;
            let matchedResult = TOKEN_REG.exec(rawContent);
            while (matchedResult !== null) {
                let prefixText = rawContent.slice(lastIndex, TOKEN_REG.lastIndex - matchedResult[0].length);
                if (prefixText.length) {
                    if (lastNode === null || lastNode.type !== 'text') {
                        lastNode = {
                            type: 'text',
                            content: prefixText
                        };
                        result.push(lastNode);
                    } else {
                        lastNode.content += prefixText;
                    }
                }
                let token = matchedResult[2] as UnitToken;
                lastNode = {
                    type: 'token',
                    integerLength: (matchedResult[1] || '').length,
                    name: TOKEN_MAP[token]!,
                    fractionalLength: (matchedResult[3] || '').length,
                    token
                };
                result.push(lastNode);
                tokens = mergeArray(tokens, [token]);
                lastIndex = TOKEN_REG.lastIndex;
                matchedResult = TOKEN_REG.exec(rawContent);
            }
            let postContent = rawContent.slice(lastIndex);
            if (postContent.length) {
                result.push({
                    type: 'text',
                    content: postContent
                });
            }
        }
    });
    return {
        tokens,
        nodes: result
    };
}

function parseIgnoreRule(segments: DurationSegment, type: IgnoreType) {
    let result: { [key in UnitName]?: boolean; } = {};
    let segmentKeys = Object.keys(segments) as UnitName[];

    if (type === 'force') {
        for (let i = 0, l = segmentKeys.length; i < l; i++) {
            let key = segmentKeys[i];
            let value = segments[key];
            result[key] = !(typeof value === 'number' && value > 0);
        }
        return result;
    } else {
        for (let i = 0, l = segmentKeys.length; i < l; i++) {
            result[segmentKeys[i]] = false;
        }
        let loop = (reverse: boolean) => {
            let keys = segmentKeys.slice();
            if (reverse) {
                keys.reverse();
            }
            for (let i = 0, l = keys.length; i < l; i++) {
                let key = keys[i];
                let value = segments[key];
                if (result[key] === true) {
                    break;
                }
                if (typeof value === 'number' && value > 0) {
                    break;
                } else {
                    result[key] = true;
                }
            }

        };
        if (type === 'head' || type === 'both') {
            loop(false);
        }
        if (type === 'tail' || type === 'both') {
            loop(true);
        }
        return result;
    }
}

export function compareFormatterOption(source: FormatOptions, target: FormatOptions) {
    let sourceKeys = Object.keys(source) as Array<keyof FormatOptions>;
    if (sourceKeys.length !== Object.keys(target).length) {
        return false;
    }
    return sourceKeys.every(sourceKey => source[sourceKey] === target[sourceKey]);
}

export function formatterGenerator(nodes: DurationTemplateNode[], option: FormatOptions): Formatter {
    return durationSegments => {
        let latestToken: UnitName | undefined;
        for (let i = TOKENS.length - 1; i >= 0; i--) {
            let name = TOKENS[i].name;
            if (durationSegments[name] !== undefined) {
                latestToken = name;
                break;
            }
        }
        if (latestToken === undefined) {
            throw Error(`format error: illegal segments`);
        }
        let ignoreRule = parseIgnoreRule(durationSegments, option.ignore);
        let formatNodes = (childNodes: DurationTemplateNode[], root: boolean): string | null => {
            let ignore: boolean = true;
            let result = childNodes.map(node => {
                switch (node.type) {
                    case 'text':
                        return node.content;
                    case 'token':
                        let nodeName = node.name;
                        let num = durationSegments[nodeName];
                        if (num !== undefined) {
                            // fractional
                            let fractionalLength = nodeName === latestToken! ? node.fractionalLength : 0;
                            let numResult = num.toFixed(fractionalLength);
                            // digital
                            numResult = paddingInteger(numResult, node.integerLength);
                            if (ignoreRule[node.name] === false) {
                                ignore = false;
                            }
                            return numResult;
                        } else {
                            throw new Error(`format error, missing token: ${nodeName} in ${JSON.stringify(durationSegments)}`);
                        }
                        break;
                    case 'optionalGroup':
                        let groupResult = formatNodes(node.children, false);
                        if (groupResult) {
                            ignore = false;
                        }
                        return groupResult;
                }
            });
            if (ignore && !root) {
                return null;
            } else {
                return result.join('');
            }
        };
        return formatNodes(nodes, true);
    };
}
