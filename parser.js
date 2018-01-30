const babylon = require('babylon');
const yaml = require('js-yaml');
const fs = require('fs');

function getAstLocationSpan(ast) {
	return {
		start: [ast.loc.start.line, ast.loc.start.column], 
		end: [ast.loc.end.line, ast.loc.end.column]
	};
}

function astFunctionFinder(ast) {
	if(ast.type == "FunctionDeclaration") {
		return [{type: "function", name: ast.id.name, locationSpan: getAstLocationSpan(ast), span: [ast.start, ast.end]}]
	}
	if(ast.body) {
		if(Array.isArray(ast.body)) {
			return ast.body.map(child => astFunctionFinder(child)).reduce((o,n) => o.concat(n),[]);
		} else {
			return astFunctionFinder(ast.body);
		}
	}
	return [];
}

function astFileToDeclarationTree(ast) {
	return {
		type: "file",
		name: "test_input.js",
		locationSpan : getAstLocationSpan(ast),
		footerSpan : [0,-1],
		parsingErrorsDetected : false,
		children: astFunctionFinder(ast.program)
	};
}

function processFile(fileIn, fileOut, callback) {
	fs.readFile(fileIn, (err, buffer) => {
		if(err) return callback(err);
		let ast = babylon.parse(buffer.toString());

		let declarationTree = astFileToDeclarationTree(ast);

		let yamlDeclarationTree = yaml.safeDump(declarationTree);

		fs.writeFile(fileOut, yamlDeclarationTree, (err) => callback(err, yamlDeclarationTree));
	});
}

module.exports = {processFile};

