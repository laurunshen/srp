/* eslint-disable */
export { NFALayout }
function NFALayout(TB, A) {
	let _range = length => Array.from({ length }).map((v, k) => k);//创建一个从0到n-1的数组
	let _new_arr_with_v = (length, value) => Array.from({ length }).map((v) => value);//生成一个长度为length的数组，每个值为value
	var transitionTable = TB;
	var alphabet = A;

	var nodesInfo = new Map();
	for (let node of _range(transitionTable.length)) {
		nodesInfo.set(node, {
			prenNodes: [],
			nextNodes: []
		});
	}//node从0到length-1
	for (let row of _range(transitionTable.length)) {
		for (let col of _range(alphabet.length)) {
			for (let e of transitionTable[row][col]) {
				nodesInfo.get(row).nextNodes.push(e);
				nodesInfo.get(e).prenNodes.push(row);
			}
		}
	}


	var stems = _new_arr_with_v(transitionTable.length, -1);
	var levels = _new_arr_with_v(transitionTable.length, -1);

	var level = -1;
	stems[0] = [0];
	levels[0] = 0;

	function _indexsOf(array, value) {
		let indexes = [];
		array.forEach((e, i) => {
			if (value === e) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}//indexes数组里存储着value出现在数组array中的下标

	function _indexsOf_2(arrayOfarray, value) {
		let indexes = [];
		//console.log(arrayOfarray);
		arrayOfarray.forEach((arr, i) => {
			if (arr === -1) return;
			if (arr.indexOf(value) != -1) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}//indexes数组里存储着value出现在二维数组array中哪一行

	function traceback(node) {
		//  从 0 到达 node 走过的轨迹
		let trace = [node];
		if (node === 0) return trace;
		let preNode = stems[node][0];
		trace.unshift(preNode);//将preNode插到trace数组的最前面
		while (preNode != 0) {
			preNode = stems[preNode][0];
			trace.unshift(preNode);
		}
		// trace.unshift(0);
		return trace;
	}

	function isStemOf(node1, node2) {
		// 判断在遍历图走到 node1 的路上是否经过 node2
		let trace_node1 = traceback(node1);
		if (trace_node1.indexOf(node2) === -1) return false;
		else return true;
	}

	function resetLevelsOf(nodes) {
		// 更新 nodes 中所有 node 的 levels， 以及所有 node 后面的点的 levels
		if (typeof nodes === 'number') nodes = [nodes];
		let nextNodes = new Set();
		for (let node of nodes) {
			levels[node] = levelOf(node);
			if (_indexsOf_2(stems, node) != -1) _indexsOf_2(stems, node).forEach(e => nextNodes.add(e));
		}
		if (nextNodes.size != 0) resetLevelsOf([...nextNodes]);
	}

	function levelOf(node) {
		let preNodes = stems[node];
		let max = 0;
		preNodes.forEach(e => {
			if (levels[e] > max) max = levels[e];
		})
		return max + 1;
	}

	function isTraceCover(trace_newone, trace_existone) {
		// 判断 trace_newone 是否 覆盖 trace_existone
		// 是的话就说明 trace_existone 是 trace_newone 的一条捷径
		let isCover = true;
		for (let node of trace_existone) {
			if (trace_newone.indexOf(node) === -1) {
				isCover = false;
				break;
			}
		}
		return isCover;
	}

	while (++level < stems.length) {
		let currentLevel = _indexsOf(levels, level);
		if (currentLevel === -1) break;
		for (let node of currentLevel) {
			let nextNodes = nodesInfo.get(node).nextNodes;
			for (let nextNode of nextNodes) {
				if (levels[nextNode] === -1) {
					// 第一次遇到 node
					stems[nextNode] = [node];
					levels[nextNode] = levels[node] + 1;
				} else {
					// nextNode 已经在某个 level 中
					// 这是 nextNode 的 stems 是有东西的
					if (stems[nextNode].indexOf(node) != -1) {
						// 之前 nextNode 的前置设置正确， 不用做更改
					} else if (isStemOf(node, nextNode)) {
						// 返回边，不理
						let pres = nodesInfo.get(node).nextNodes;
						let index;
						pres.forEach(e => {
							if (e === nextNode) index = transitionTable[node][alphabet.indexOf('ε')].indexOf(e);
						})
						if (index != -1) transitionTable[node][alphabet.indexOf('ε')].splice(index, 1)
					} else {
						if (stems[nextNode].length > 1) {
							// 似乎可以肯定 nextNode 是一个并点
							stems[nextNode].push(node);
							resetLevelsOf(node);
						} else {
							// 目前不确定 nextNode 是不是一个并点
							let trace_existone = traceback(nextNode);
							let trace_newone = traceback(node);
							trace_newone.push(nextNode);
							///
							if (isTraceCover(trace_newone, trace_existone)) {
								// 从 transitionTable 中删除捷径
								// nextNode 的 “前一个” 节点集合里面有两个点， 其中一个是我们想要的前继节点（也就是现在的 node），
								// 另外一个是走了捷径才到的，这条捷径（这个点到 nextNode的边）应该标记删除。
								let pres = nodesInfo.get(nextNode).prenNodes;
								let index;
								let preNode;
								pres.forEach(e => {
									if (stems[nextNode].indexOf(e) != -1) preNode = e;
								})
								index = transitionTable[preNode][alphabet.indexOf('ε')].indexOf(nextNode);
								if (index != -1) transitionTable[preNode][alphabet.indexOf('ε')].splice(index, 1);


								// nextNode 存在，但是之前设置的 stem 是错的，正解为 node
								stems[nextNode] = [node];
								// 把所有受影响的 node 的 levels 改正确
								// 注意后面的节点的排序目前认为是正确的，故只需要遍历一下改正 level 就 ok
								resetLevelsOf(nextNode);
							} else {
								// nextNode 是一个并点
								stems[nextNode].push(node);
								resetLevelsOf(nextNode);
							}
						}
					}
				}
			}
		}
	}

	var graph = [];
	var l = 0;
	while (l < level) graph.push(_indexsOf(levels, l++));

	let nodesLevelInfo = new Map();
	graph.forEach((arr, level) => arr.forEach(node => nodesLevelInfo.set(node, level + 1)));

	return [transitionTable, nodesLevelInfo];
}
