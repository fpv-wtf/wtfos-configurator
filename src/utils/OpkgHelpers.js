const parsePackageIndex = (content) => {
  const lines = content.split("\n");
  const arrays = ["section"];

  let currentPackage = null;
  const packages = {};
  for(let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fields = line.split(": ");
    let key = fields.shift();
    const value = fields.join(": ");

    if(key === "Package") {
      packages[value] = {};
      currentPackage = value;
    } else {
      key = key.toLowerCase();

      packages[currentPackage][key] = value;
      if(arrays.includes(key)) {
        packages[currentPackage][key] = value.split(",").map((item) => item.trim());
      }
    }
  }

  return packages;
};

export {
  parsePackageIndex,
};
