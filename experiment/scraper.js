function area(element) {
	return element.offsetHeight * element.offsetWidth;
}

function getBiggestElement(selector){
	let elements = Array.from(document.querySelectorAll(selector))
	let biggest = elements.reduce((max, elem) => area(elem) > area(max) ? elem : max, {offsetHeight: 0, offsetWidth: 0});
	return biggest
}

/**
 * Generates structural selector (describing element by its DOM tree location).
 * 
 * **The generated selector is not guaranteed to be unique! (In fact, this is the desired behaviour.)**
 * @param {HTMLElement} element Element being described.
 * @returns {string} CSS-compliant selector describing the element's location in the DOM tree.
 */
function GetSelectorStructural(element) {
    // Base conditions for the recursive approach.
    if (element.tagName === 'BODY') {
      return 'BODY';
    }
    let selector = element.tagName;
    if(element.parentElement){
      return `${this.GetSelectorStructural(element.parentElement)} > ${selector}`;
    }
    else{
      return selector;
    }
}

/**
* @typedef {Array<{x: number, y: number}>} Grid
*/

/**
 * Returns an array of grid-aligned {x,y} points.
 * @param {number} [granularity=0.005] sets the number of generated points (the higher the granularity, the more points).
 * @returns {Grid} Array of {x, y} objects.
 */
function getGrid(startX = 0, startY = 0, granularity = 0.005){
	const width = window.innerWidth;
	const height = window.innerHeight;

	out = []
	for(let x = 0; x < width; x += 1/granularity){
		for(let y = 0; y < height; y += 1/granularity){
			out.push({x: startX + x, y: startY + y});
		}
	}
	return out
}

const different = (x,i,a) => a.findIndex(e => e === x) === i;

/**
 * Heuristic method to find collections of "interesting" items on the page.
 * @returns {Array<HTMLElement>} A collection of interesting DOM nodes (online store products, plane tickets, list items... and many more?)
 */
function scrapableHeuristics(maxCountPerPage = 50, minArea = 20000, scrolls = 3, metricType = "size_deviation"){
	const restoreScroll = (() => {
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		return () => {
			window.scrollTo(scrollX,scrollY);
		}
	})();

	maxSelector = {selector: "", metric: 0};

	for(let scroll = 0; scroll < scrolls; scroll++){
		window.scrollTo(0,scroll*window.innerHeight)
		
		const grid = getGrid();
		
		for(let point of grid){
			const currentElement = document.elementFromPoint(point.x, point.y);
			const selector = GetSelectorStructural(currentElement);

			const elements = Array.from(document.querySelectorAll(selector)).filter(element => area(element) > minArea);

			// If the current selector targets less than three elements, we consider it not interesting (would be a very underwhelming scraper)
			if(elements.length < 3){
				continue;
			}

			if(metricType === "total_area"){
				var metric = elements
					.reduce((p, x) => p + area(x), 0);
			}
			else if(metricType === "size_deviation"){
				// This could use a proper "statistics" approach... but meh, so far so good!
				const sizes = elements
					.map(element => area(element))

				var metric = (1 - (Math.max(...sizes) - Math.min(...sizes))/Math.max(...sizes));
			}

			// console.debug(`Total ${metricType} is ${metric}.`)
			if(metric > maxSelector.metric && elements.length < maxCountPerPage){
				maxSelector = {selector, metric}
			}
		}
	}

	restoreScroll();

	let out = Array.from(document.querySelectorAll(maxSelector.selector));

	while (out.map(x => x.parentElement).every(different)){
		out = out.map(x => x.parentElement);
	} 

	return out;
}