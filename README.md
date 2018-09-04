# Install

```shell
npm install easy-duration
```

# Usage

```javascript
// import
import Duration from 'easy-duration'; // ECMA Module

// instance
const duration = new Duration(1234000); // 1234000 milliseconds

// format
duration.format('H:m:s')

```

# API

## Duration

`Duration(milliseconds)`
- @class
- @param {number} `milliseconds`

## Duration#normalize
`duration.normalize(unitToken)`
- @param {string[]} `unitTokens` - 由unitToken组成的数组
- @return {Object} - 返回按tokens运算后的结果，键名分别对应的单位名称

### unitToken

单位 | 字符 | 表示
-|-|-
week | W,w | 周
day | D,d | 日
hour | H | 时
minute | m | 分
second | s | 秒

```javascript

const msInSecond = 1000;
const msInMinute = 60 * msInSecond;
const msInHour = 60 * msInMinute;
// 输出的结果只会包含传入的tokens相应的单位
new Duration(msInHour * 1 + msInMinute * 2).normalize(['H', 'm', 's']) // {hour: 1, minute: 2, second: 0}
new Duration(msInHour * 1 + msInMinute * 2).normalize(['m']) // {minute: 62}
new Duration(msInHour * 1 + msInMinute * 2).normalize(['w','m']) // {week: 0, minute: 62}
// 最低位会保留小数
new Duration(msInHour * 1 + msInMinute * 2 * msInSecond * 30).normalize(['H', 'm']) // {hour: 1, minute: 2.5}

```
## Duration#format
`duration.format(template, options)`
- @param {string} `template` - 模式字符串
- @param {Object} `[options]`
- @param {enum} `[options.ignore="both"]`
    - `"head"`: 省略优先级较高的组并保持连续性
    - `"tail"`: 省略优先级较低的组并保持连续性
    - `"both"`: 从两头同时省略并保持连续性
    - `"force"`: 省略所有可省略的可选组，不保持连续性
- @return {string} 格式化后的字符串

```javascript
const msInSecond = 1000;
const msInMinute = 60 * msInSecond;
const msInHour = 60 * msInMinute;

new Duration(msInHour * 1 + msInMinute * 2).format('H时m分'); // 1时2分
new Duration(msInHour * 1 + msInMinute * 2 + msInSecond * 30).format('H时m分'); // 1时2分
new Duration(msInHour * 1 + msInMinute * 2 + msInSecond * 30).format('m分'); // 62分
new Duration(msInHour * 1 + msInMinute * 22 + msInSecond * 30).format('HH时mm分'); // 01时22分

// 支持展示小数点
new Duration(msInHour * 1 + msInMinute * 2 + msInSecond * 30).format('H时m.m分'); // 1时2.5分
// 小数点仅对优先级最小的单位有效
new Duration(msInHour * 1 + msInMinute * 2 + msInSecond * 30).format('H.H时m.m分'); // 1时2.5分
// 小数点长度可以自由控制
new Duration(msInHour * 1 + msInMinute * 2 + msInSecond * 30).format('H时m.mm分'); // 1时2.50分

// 模板字符串转义
new Duration(msInHour * 1).format('HHH'); // 111
new Duration(msInHour * 1).format('H\\HH'); // 1H1
new Duration(msInHour * 1).format('H{HH}'); // 1HH
new Duration(msInHour * 1).format('H{H\\H}'); // 1H\H
new Duration(msInHour * 1).format('H\\{H\\}'); // 1{1}


// 可以把模板的一部分标记为可选
new Duration(msInMinute * 2 + msInSecond * 30).format('[H时][m分][s秒]'); // 2分30秒
new Duration(msInMinute * 2).format('[H时][m分][s秒]'); // 2分

// 配合 formatOptions.ignore 控制可选组展示条件
new Duration(msInMinute * 2).format('[H时][m分][s秒]', {
    ignore: 'tail' // 省略优先级较低的组
}); // 0时1分

```

## Duration#weeks, #days, #hours, #minutes, #seconds

`duration.years(round)`
- @param {boolean} `[round=false]` 为true时返回整数(`Math.round`)，默认为false
- @return {number}

```javascript
const msInSecond = 1000;
const msInMinute = 60 * msInSecond;
const msInHour = 60 * msInMinute;

new Duration(msInHour * 1 + msInSecond * 30).hours() // 1;
new Duration(msInHour * 1 + msInSecond * 30).hours(true) // 1.5;
new Duration(msInHour * 1 + msInSecond * 30).minutes(true) // 90;
```
