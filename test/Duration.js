if (process.env.NODE_ENV === 'development') {
    var Duration = require('../src').default;
    var chai = window.chai;
} else {
    var Duration = require('../dist/commonjs/easy-duration').default;
    var chai = require('chai');
}

const msInSecond = 1000;
const msInMinute = 60 * msInSecond;
const msInHour = 60 * msInMinute;
const msInDay = 24 * msInHour;
const msInWeek = 7 * msInDay;

describe('Duration#normalize', function () {
    it('result should only include specify key', function () {
        let duration = new Duration(msInSecond * 90);
        let result = duration.normalize(['m', 's']);
        chai.expect(result).to.be.eql({
            minute: 1,
            second: 30
        })
    });

    it('value of last unit may have fractional part', function () {
        let duration = new Duration(msInMinute * 1.5);
        let result = duration.normalize(['m']);
        let value = result.minute;
        chai.expect(value).to.be.equal(1.5);
    });

    it('value should be 0 when duration can divide by larger unit or smaller than 1', function () {
        let duration = new Duration(msInMinute * 1);
        let result = duration.normalize(['H', 'm', 's']);
        chai.expect(result).to.be.eql({
            hour: 0,
            minute: 1,
            second: 0
        });
    });

    it('full unit', function () {
        let duration = new Duration(
            msInWeek * 1 +
            msInDay * 2 +
            msInHour * 3 +
            msInMinute * 4 +
            msInSecond * 5.6
        );
        let result = duration.normalize(['W', 'D', 'H', 'm', 's']);
        chai.expect(result).to.be.eql({
            week: 1,
            day: 2,
            hour: 3,
            minute: 4,
            second: 5.6
        });
    });

    it('sparse unit', function () {
        let duration = new Duration(
            msInWeek * 1 +
            msInSecond * 2.3
        );
        let result = duration.normalize(['W', 's']);
        chai.expect(result).to.be.eql({
            week: 1,
            second: 2.3
        });
    });
});

describe('Duration#format', function () {
    context('basic format', function () {
        let duration = new Duration(
            msInHour * 1 +
            msInMinute * 2
        );
        it('ordered', function () {
            chai.expect(duration.format('H:m')).to.be.equal('1:2');
        });
        it('out of order', function () {
            chai.expect(duration.format('m:H')).to.be.equal('2:1');
        });
    });

    context('fractional part', function () {
        it('base', function () {
            let duration = new Duration(msInHour * 1.23);
            chai.expect(duration.format('H.H')).to.be.equal('1.2');
        })

        it('fractional part only exist in the smallest unit', function () {
            let duration = new Duration(
                msInHour * 1 +
                msInMinute * 2.5
            );
            chai.expect(duration.format('HH.HH:mm.mm')).to.be.equal('01:02.50');
        })
    });

    context('zero-pendding', function () {
        it('interger part', function () {
            let duration = new Duration(msInHour * 1);
            chai.expect(duration.format('HH')).to.be.equal('01');
        });

        it('fractional part', function () {
            let duration = new Duration(msInHour * 1.23);
            chai.expect(duration.format('H.HHH')).to.be.equal('1.230');
        });

        it('multiple unit', function () {
            let duration = new Duration(
                msInHour * 1 +
                msInMinute * 2.5
            );
            chai.expect(duration.format('HH:mm.mm')).to.be.equal('01:02.50');
        });
    });

    context('escape', function () {
        let duration = new Duration(msInHour * 1);
        it('unit token', function () {
            chai.expect(duration.format('H\\HH')).to.be.equal('1H1');
        });

        it('escape token', function () {
            chai.expect(duration.format('H\\\\H')).to.be.equal('1\\1');
        });

        it('gruop', function () {
            chai.expect(duration.format('H{H}H')).to.be.equal('1H1');
            chai.expect(duration.format('H{\\H}H')).to.be.equal('1\\H1');
        })

        it('delimiter', function () {
            chai.expect(duration.format('H\\{H\\}')).to.be.equal('1{1}');
            chai.expect(duration.format('H\\[H\\]')).to.be.equal('1[1]');
        });
    });

    context('optional', function () {
        let duration = new Duration(msInHour * 1);
        it('basic', function () {
            chai.expect(duration.format('HH:mm[:ss]')).to.be.equal('01:00');
            chai.expect(duration.format('HH[:mm][:ss]')).to.be.equal('01');
            chai.expect(duration.format('[HH][:mm][:ss]')).to.be.equal('01');
        });

        it('multiple unit', function () {
            chai.expect(duration.format('[HH:mm]')).to.be.equal('01:00');
            chai.expect(duration.format('[HH][:mm:ss]')).to.be.equal('01');
        });
    });

    context('option.ignore', function () {
        let duration = new Duration(
            msInDay * 1 +
            msInMinute * 2
        );
        it('head', function () {
            // ordered
            chai.expect(duration.format('[W]-[D]-[H]-[m]-[s]', {
                ignore: 'head'
            })).to.be.equal('-1-0-2-0');
            // out of order
            chai.expect(duration.format('[D]-[H]-[m]-[s]-[W]', {
                ignore: 'head'
            })).to.be.equal('1-0-2-0-');
        });

        it('tail', function () {
            // ordered
            chai.expect(duration.format('[W]-[D]-[H]-[m]-[s]', {
                ignore: 'tail'
            })).to.be.equal('0-1-0-2-');
            // out of order
            chai.expect(duration.format('[D]-[H]-[m]-[s]-[W]', {
                ignore: 'tail'
            })).to.be.equal('1-0-2--0');
        });

        it('both', function () {
            // ordered
            chai.expect(duration.format('[W]-[D]-[H]-[m]-[s]', {
                ignore: 'both'
            })).to.be.equal('-1-0-2-');
            // out of order
            chai.expect(duration.format('[D]-[H]-[m]-[s]-[W]', {
                ignore: 'both'
            })).to.be.equal('1-0-2--');
        });

        it('force', function () {
            // ordered
            chai.expect(duration.format('[W]-[D]-[H]-[m]-[s]', {
                ignore: 'force'
            })).to.be.equal('-1--2-');
            // out of order
            chai.expect(duration.format('[D]-[H]-[m]-[s]-[W]', {
                ignore: 'force'
            })).to.be.equal('1--2--');
        });
    });
});

describe('Duration#weeks', function () {
    let duration = new Duration(msInWeek * 1.2);
    it('round=false', function () {
        chai.expect(duration.weeks()).to.be.equal(1.2);
        chai.expect(duration.weeks(false)).to.be.equal(1.2);
    });
    it('round=true', function () {
        chai.expect(duration.weeks(true)).to.be.equal(1);
    });
});

describe('Duration#days', function () {
    let duration = new Duration(msInDay * 1.2);
    it('round=false', function () {
        chai.expect(duration.days()).to.be.equal(1.2);
        chai.expect(duration.days(false)).to.be.equal(1.2);
    });
    it('round=true', function () {
        chai.expect(duration.days(true)).to.be.equal(1);
    });
});

describe('Duration#hours', function () {
    let duration = new Duration(msInHour * 1.2);
    it('round=false', function () {
        chai.expect(duration.hours()).to.be.equal(1.2);
        chai.expect(duration.hours(false)).to.be.equal(1.2);
    });
    it('round=true', function () {
        chai.expect(duration.hours(true)).to.be.equal(1);
    });
});

describe('Duration#minutes', function () {
    let duration = new Duration(msInMinute * 1.2);
    it('round=false', function () {
        chai.expect(duration.minutes()).to.be.equal(1.2);
        chai.expect(duration.minutes(false)).to.be.equal(1.2);
    });
    it('round=true', function () {
        chai.expect(duration.minutes(true)).to.be.equal(1);
    });
});

describe('Duration#seconds', function () {
    let duration = new Duration(msInSecond * 1.2);
    it('round=false', function () {
        chai.expect(duration.seconds()).to.be.equal(1.2);
        chai.expect(duration.seconds(false)).to.be.equal(1.2);
    });
    it('round=true', function () {
        chai.expect(duration.seconds(true)).to.be.equal(1);
    });
});
