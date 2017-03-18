const cheerio = require('cheerio');
const queryString = require('query-string');
const request = require('request').defaults({ jar: true });
const winston = require('winston');

const ROOT_HOSTNAME = 'https://www.reserveamerica.com';

export default class Searcher {
    constructor(url, contractCode, parkId, campingDate, campingDates,
        lengthOfStay, loop, loops, lookingFor) {
        this.url = url;
        this.contractCode = contractCode;
        this.parkId = parkId;
        this.campingDate = campingDate;
        this.campingDates = campingDates;
        this.lengthOfStay = lengthOfStay;
        this.loop = loop;
        this.loops = loops;
        this.lookingFor = lookingFor;
    }

    searchLoop(campingDate, loop) {
        return new Promise((resolve) => {
            winston.log('info', 'Starting search for loop:', loop, ', date:', campingDate.trim());
            const formData = {
                contractCode: this.contractCode,
                parkId: this.parkId,
                siteTypeFilter: 'ALL',
                availStatus: '',
                submitSiteForm: true,
                search: 'site',
                campingDate: campingDate.trim(),
                lengthOfStay: this.lengthOfStay,
                currentMaximumWindow: 12,
                contractDefaultMaxWindow: 'MS:24,LT:18,GA:24,SC:13,PA:24',
                stateDefaultMaxWindow: 'MS:24,GA:24,SC:13,PA:24',
                defaultMaximumWindow: '12',
                loop: Number(loop),
                siteCode: '',
                lookingFor: this.lookingFor,
            };
            const j = request.jar();
            // NOTE: extra request to get cookie
            request({ url: this.url, jar: j }, () => {
                winston.log('info', 'get: ', this.url);
                request.post({ url: this.url, form: formData, jar: j }, (error, response, body) => {
                    winston.log('info', 'post: ', this.url);
                    // winston.log('info', body);
                    const $ = cheerio.load(body);

                    const matchSummary = $('#colbody1 > .searchSummary .matchSummary');
                    winston.log('debug', 'Match found: ', matchSummary.length);

                    if (matchSummary.length > 1 || matchSummary.length === 0) {
                        throw new Error('Unexpected number of summary.  HTML might have changed');
                    }
                    const summary = matchSummary.text();
                    winston.log('info', matchSummary.text());

                    if (summary.indexOf('0 site') === -1) {
                        const bookNowUrls = [];

                        $('a.book.now').each((i, el) => {
                            const additionalQuery = {
                                arrivaldate: formData.campingDate,
                                lengthOfStay: formData.lengthOfStay,
                            };
                            const additionalQueryString = queryString.stringify(additionalQuery);
                            const finalUrl = `${ROOT_HOSTNAME}${$(el).prop('href')}&${additionalQueryString}`;

                            bookNowUrls.push(finalUrl);
                        });

                        winston.log('info', `bookNowUrls: ${bookNowUrls.length}`);
                        winston.log('info', 'FOUND');
                        resolve(summary, formData, this.url, bookNowUrls);
                    }

                    winston.log('info', 'Script done: ', new Date());
                });
            });
        });
    }

    searchAllLoops(campingDate, notifier) {
        if (this.loops) {
            this.loops.forEach((loop) => {
                this.searchLoop(campingDate, loop)
                    .then(notifier);
            });
        } else {
            this.searchLoop(campingDate, this.loop)
                .then(notifier);
        }
    }

    searchallDates(notifier) {
        if (this.campingDates) {
            this.campingDates.forEach((campingDate) => {
                this.searchAllLoops(campingDate, notifier);
            });
        } else {
            this.searchAllLoops(this.campingDate, notifier);
        }
    }

    searchAll(notifier) {
        this.searchallDates(notifier);
    }
}
