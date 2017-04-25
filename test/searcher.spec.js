import 'babel-polyfill';
import assert from 'assert';
import Searcher from '../src/index';

describe('searcher', () => {
    it('should complete run for a single date', (done) => {
        const url = 'https://www.reserveamerica.com/camping/pinnacles-campground/r/campgroundDetails.do?contractCode=NRSO&parkId=73984';
        const contractCode = 'NRSO';
        const parkId = '73984';
        const campingDates = [
            'Fri May 5 2017',
        ];
        const lengthOfStay = '2';
        const loops = ['87165'];
        const lookingFor = '2003';

        const searcher = new Searcher(url, contractCode, parkId, null, campingDates,
            lengthOfStay, null, loops, lookingFor);

        searcher.setOnDoneHandler(() => {
            assert.ok(true);
            done();
        });

        searcher.searchallDates();
    });

    it('should error on run for an old date', () => {
        const url = 'https://www.reserveamerica.com/camping/pinnacles-campground/r/campgroundDetails.do?contractCode=NRSO&parkId=73984';
        const contractCode = 'NRSO';
        const parkId = '73984';
        const campingDates = [
            'Sat Apr 22 2017',
        ];
        const lengthOfStay = '2';
        const loops = ['87165'];
        const lookingFor = '2003';

        const searcher = new Searcher(url, contractCode, parkId, null, campingDates,
            lengthOfStay, null, loops, lookingFor);

        assert.throws(searcher.searchallDates);
    });

    it('should be ok running multiple dates', (done) => {
        const url = 'https://www.reserveamerica.com/camping/pinnacles-campground/r/campgroundDetails.do?contractCode=NRSO&parkId=73984';
        const contractCode = 'NRSO';
        const parkId = '73984';
        const campingDates = [
            'Fri May 5 2017',
            'Fri May 26 2017',
            'Fri Apr 28 2017',
        ];
        const lengthOfStay = '2';
        const loops = ['87165', '87166', '87167'];
        const lookingFor = '2003';

        const searcher = new Searcher(url, contractCode, parkId, null, campingDates,
            lengthOfStay, null, loops, lookingFor);

        let doneTimes = 0;
        searcher.setOnDoneHandler(() => {
            if (doneTimes === 8) {
                assert.ok(true);
                done();
            }

            doneTimes += 1;
        });

        searcher.searchallDates();
    });
});
