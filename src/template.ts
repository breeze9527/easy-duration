import { isSMPCharacter } from './utils';

export interface TemplateRootNode {
    type: 'root';
    children: TemplateNode[];
}
export interface TemplatePatternNode {
    type: 'pattern';
    patternName: string;
    children: TemplateNode[];
}
export interface TemplateLiteralNode {
    type: 'raw' | 'escaped';
    content: string;
}
export type TemplateNode = TemplateLiteralNode | TemplatePatternNode;

export interface ParseOption {
    escapeToken: string;
    pattern: {
        [name: string]: {
            delimiter: [string, string];
            disableEscape?: boolean;
            nested?: boolean;
        };
    };
}

interface NormalizedDelimiter {
    open: string;
    close: string;
    name: string;
}

function startOf(target: string, sub: string, formIndex: number = 0) {
    return target.slice(formIndex, formIndex + sub.length) === sub;
}

function normalizeDelimiter(patterns: ParseOption['pattern']): NormalizedDelimiter[] {
    return Object.keys(patterns).map<NormalizedDelimiter>(name => {
        let pattern = patterns[name];
        let delimiter = pattern.delimiter;
        return {
            open: delimiter[0],
            close: delimiter[1],
            name
        };
    });
}

export function parse(template: string, option: ParseOption): TemplateNode[] {
    let templateLength = template.length;
    let escapeToken = option.escapeToken;
    let index = 0;
    let pattern = option.pattern;
    let parsePath: Array<TemplateRootNode | TemplateNode> = [{
        type: 'root',
        children: []
    }];
    let delimiters = normalizeDelimiter(pattern);

    while (index < templateLength) {
        let lastNode = parsePath[parsePath.length - 1];
        // escape
        if (
            !(lastNode.type === 'pattern' && pattern[lastNode.patternName].disableEscape === true) &&
            startOf(template, escapeToken, index)
        ) {
            index += escapeToken.length;
            let content = template[index];
            if (content) {
                if (isSMPCharacter(content)) {
                    content += template[index];
                }
                index += content.length;
            } else {
                continue;
            }
            if (lastNode.type === 'escaped') {
                lastNode.content += content;
            } else {
                let newNode: TemplateLiteralNode = {
                    type: 'escaped',
                    content
                };
                if (lastNode.type === 'raw') {
                    parsePath.pop();
                    lastNode = parsePath[parsePath.length - 1];
                }
                if (lastNode.type === 'root' || lastNode.type === 'pattern') {
                    lastNode.children.push(newNode);
                    parsePath.push(lastNode);
                }
            }
            continue;
        }

        let foundedTag: string | undefined;
        if (!(lastNode.type === 'pattern' && pattern[lastNode.patternName].nested === true)) {
            delimiters.some(delimiter => {
                let closeTag = delimiter.close;

                if (startOf(template, delimiter.open, index)) {
                    let targetNode = parsePath.pop();
                    if (targetNode && targetNode.type !== 'root' && targetNode.type !== 'pattern') {
                        targetNode = parsePath.pop() as (TemplateRootNode | TemplatePatternNode | undefined);
                    }
                    if (targetNode === undefined) {
                        throw new Error(`parse template error: ${template}`);
                    }
                    let newNode: TemplatePatternNode = {
                        type: 'pattern',
                        patternName: delimiter.name,
                        children: []
                    };
                    targetNode.children.push(newNode);
                    parsePath.push(targetNode);
                    parsePath.push(newNode);
                    foundedTag = delimiter.open;
                } else if (startOf(template, closeTag, index)) {
                    while (parsePath.length) {
                        let targetNode = parsePath.pop()!;
                        if (targetNode.type === 'pattern') {
                            if (pattern[targetNode.patternName].delimiter[1] === closeTag) {
                                foundedTag = closeTag;
                                break;
                            } else {
                                throw new SyntaxError(`unexpected close tag [${closeTag}] in position ${index}`);
                            }
                        }
                    }
                    if (foundedTag === undefined) {
                        throw new SyntaxError(`unexpected close tag [${closeTag}] in position ${index}`);
                    }
                }

                return foundedTag !== undefined;
            });
        }

        if (foundedTag) {
            index += foundedTag.length;
        } else {
            if (lastNode.type === 'escaped') {
                parsePath.pop();
                lastNode = parsePath[parsePath.length - 1];
            }

            let targetCharacter = template[index];
            if (isSMPCharacter(targetCharacter)) {
                targetCharacter += template[index + 1];
            }
            switch (lastNode.type) {
                case 'raw':
                    lastNode.content += targetCharacter;
                    break;

                case 'pattern':
                case 'root':
                    let newNode: TemplateLiteralNode = {
                        type: 'raw',
                        content: targetCharacter
                    };
                    lastNode.children.push(newNode);
                    parsePath.push(newNode);
                    break;
            }

            index += targetCharacter.length;
        }
    }

    let root = parsePath.pop();
    if (root && root.type !== 'root') {
        // last node maybe is a lateral node of root node
        root = parsePath.pop();
    }
    if (!root || root.type !== 'root') {
        throw new Error(`parse template error: ${template}`);
    } else {
        return root.children;
    }
}
