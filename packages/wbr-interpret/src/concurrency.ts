/**
 * Concurrency class for running concurrent tasks while managing a limited amount of resources.
 */
export default class Concurrency {
    /**
     * Maximum number of workers running in parallel. If set to `null`, there is no limit.
     */
    maxConcurrency : number = 1;
    /**
     * Number of currently active workers.
     */
    activeWorkers : number = 0;
    /**
     * Queue of workers waiting to be run.
     */
    private workerQueue : Function[] = [];
    /**
     * "Resolve" callbacks of the waitForCompletion() promises.
     */
    private waiting : Function[] = [];
  
  
    /**
     * Constructs a new instance of concurrency manager.
     * @param {number} maxConcurrency Maximum number of workers running in parallel.
     */
    constructor(maxConcurrency: number){
      this.maxConcurrency = maxConcurrency;
    }

    /**
     * Takes a waiting worker out of the queue and runs it. 
     */
    private runNextWorker() : void{
        const worker = this.workerQueue.pop();
    
        if(worker){
          //console.debug("Running a worker...");
          worker().then(() => {
            //console.debug("Worker finished, running the next waiting worker...");
            this.runNextWorker();
          })
        }
        else{
          //console.debug("No waiting worker found!");
          this.activeWorkers--;
          if(this.activeWorkers === 0){
            //console.debug("This concurrency manager is idle!");
            this.waiting.forEach(x => x());
          }
        }
      }
  
    /**
     * Pass a worker (an async function) to the concurrency manager. \
     * The time of the worker's execution depends on the concurrency manager itself (given a generous enough `maxConcurrency` value, it might be immediate, but this is not guaranteed).
     * @param worker Async function to be executed (job to be processed).
     */
    addWorker(worker: () => Promise<any>) : void {
      //console.debug("Adding a worker!");
      this.workerQueue.push(worker);
  
      if(!this.maxConcurrency || this.activeWorkers < this.maxConcurrency){
        this.runNextWorker();
        this.activeWorkers++;
      }
      else{
        //console.debug("No capacity to run a worker now, waiting!");
      }
    }
  
    /**
     * Waits until there is no running nor waiting worker. \
     * If the concurrency manager is idle at the time of calling this function, it waits until at least one job is compeleted.
     * @returns Promise, resolved after there is no running/waiting worker.
     */
    waitForCompletion() : Promise<void> {
      return new Promise((res) => {
        this.waiting.push(res);
      })  
    }
  }
  