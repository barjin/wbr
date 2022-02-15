import Concurrency from '../build/concurrency';

function generateWaiter(time: number, out: number[]) {
    return async () => {
        await new Promise(res => setTimeout(res, time));
        if(out){
            out.push(out.length + 1);
        }
    } 
}

function runConcurrencyJob(numJobs: number, maxParallel: number, jobLength: number, done: () => void){
    const c = new Concurrency(maxParallel);
    let results : number[] = []

    const startTime : number = +new Date();

    for(let i = 0; i < numJobs; i++){
        c.addJob(generateWaiter(jobLength, results));
    }    
    
    c.waitForCompletion().then(() => {
        const endTime = +new Date();
        const bestCase = Math.ceil(numJobs/maxParallel) * jobLength;

        expect(endTime - startTime).toBeGreaterThanOrEqual(bestCase-5); // 5 milliseconds to weed out possible timing inaccuracy
        expect(endTime - startTime).toBeLessThan(1.05 * bestCase);

        expect(results.length).toBe(numJobs);
        done();
    });
}

const JOB_LENGTH = 2000;

test('Single task', (done) => {
    runConcurrencyJob(1,1,JOB_LENGTH,done);
});

test('Free capacity', (done) => {
    runConcurrencyJob(3,5,JOB_LENGTH,done);
});

test('Waiting in queue', (done) => {
    runConcurrencyJob(4,2,JOB_LENGTH,done);
});