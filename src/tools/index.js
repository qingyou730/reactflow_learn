
export const fetchInterviewData = async (callback = console.log) => {
  const baseURL = "https://gpt-api.hyperex.cc";
  try {
    const { body: readableStream } = await fetch(`${baseURL}/ai/interview`, {
      method: "POST",
      headers: {
        "Authorization": "6ai27zl9180djk2mp0ahn6eii",
        "Content-Type": "application/json",
      },
    });
    if (!readableStream) throw new Error("No readable stream");

    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      callback(text);
    }
  } catch (error) {
    console.error(error);
  }
};

export function throttle(func, wait) {
  let inThrottle = false;
  return function() {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        func.apply(this, arguments);
      }, wait);
    }
  };
}

export function generateId() {
  const timestamp = Date.now();
  const random = Math.random();

  return `${timestamp}-${random}`;
}

export function parseText(text) {
  let lines = text.split("\n");
  // 将 text 转换为 对象数组结构 后面进行树的构建
  lines = lines
    .map((line) => {
      let str = line.trim();
      const matchArr = str.match(/(-|t\d+):(.*)/g);

      //匹配 标题 eg: t2: 参与实际项目开发;
      if (matchArr && matchArr.length) {
        let arr = matchArr[0].split(":");
        return {
          id: generateId(),
          content: arr[1],
          level: arr[0],
          children: [],
          type: "title",
        };
      }

      if (str.startsWith("contents:")) {
        return {
          content: str,
          type: "contents",
        };
      }

      return undefined;
    })
    .filter((i) => !!i);

  let elements = [],
    i = 0;

  // 构建每一个 element 节点
  while (i < lines.length) {
    const current = lines[i];
    i++;
    if (!current) break;

    if (current && current.type === "title") {
      elements.push({
        id: current.id,
        level: current.level,
        title: current.content,
        children: [],
        contents: undefined,
      });
    }
    if (current && current.type === "contents") {
      elements[elements.length - 1].contents = current.content;
    }
  }

  // 构建树
  i = 0;
  let tree = [],
    stack = [],
    levelMap = {};

  function checkIsChild(ele, stack) {
    const level = Number(ele.level.replace("t", ""));
    const pre = stack[stack.length - 1],
      preLevel = Number(pre.level.replace("t", ""));

    if (level - 1 === preLevel) {
      pre.children.push(ele);
      ele.parentId = pre.id;
    } else if (level === preLevel) {
      stack[preLevel - 2].children.push(ele);
      ele.parentId = stack[preLevel - 2].id;
      stack.pop();
    } else if (level < preLevel) {
      stack.pop();
      checkIsChild(ele, stack);
    }
    stack.push(ele);
  }

  elements.forEach((ele) => {
    const level = Number(ele.level.replace("t", ""));

    if (!levelMap[level]) levelMap[level] = 0;
    levelMap[level] = levelMap[level] + 1;

    if (level === 1) {
      if (stack.length > 0) stack = [];
      stack.push(ele);
      tree.push(ele);
    } else {
      checkIsChild(ele, stack);
    }
  });

  /**
   * 根据树结构和每一层元素数量， 构建 nodes 和 edges。
   */

  const initialNodes = [],
    initialEdges = [],
    loopMap = {},
    clientWidth = document.documentElement.clientWidth;
  elements.forEach((ele) => {
    /**
     * nodes 的 x y 坐标计算
     */
    const level = Number(ele.level.replace("t", ""));
    if (!loopMap[level]) loopMap[level] = 0;
    const currIndex = loopMap[level];
    const levelNum = levelMap[level] || 0;

    const node = {
      id: ele.id,
      data: { label: ele.level, content: ele.contents, title: ele.level },
      type: 'textUpdater',
    };

    const position = { x: 0, y: 0 };
    position.x = (currIndex - Math.ceil(levelNum / 2)) * 250 + clientWidth / 2;
    position.y = level * 200;

    // const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];
    if (ele.children.length > 0) {
      ele.children.forEach((c) => {
        const edge = {
          id: generateId(),
          source: ele.id,
          target: c.id,
        };
        initialEdges.push(edge);
      });
    }

    node.position = position;
    loopMap[level] = currIndex + 1;
    initialNodes.push(node);
  });


  return {
    initialNodes,
    initialEdges,
  };
}