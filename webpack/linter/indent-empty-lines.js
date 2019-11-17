/* eslint-disable import/no-commonjs */
"use strict";

module.exports = {
  meta: {
    docs: {
      description: "enforce indention on empty lines",
      category: "Stylistic Issues",
      recommended: false,
    },
    
    fixable: "whitespace",
    
    schema: [{
      oneOf: [
        { enum: ["tab"] },
        { type: "integer", minimum: 0 },
      ],
    }],
  },
  
  create(context) {
    const sourceCode = context.getSourceCode();
    
    return {
      Program: function checkTrailingSpaces(node) {
        const lines = sourceCode.lines,
              indentRE = /^[ \t]*/,
              bracketRE = /^[ \t]*[)}\]]/,
              padding = context.options[0] === "tab" ? "\t" : " ".repeat(context.options[0] || 0),
              linesPos = [];
        
        let desiredIndent = "",
            currentPos = 0;
        
        for(const line of lines) {
          linesPos.push(currentPos);
          currentPos += line.length + 1; // assume LF line breaks
        }
        
        for(let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          const currentIndent = indentRE.exec(line)[0];
          
          if(line === currentIndent) { // empty            
            if(currentIndent !== desiredIndent) {
              const range = [
                linesPos[i],
                linesPos[i] + currentIndent.length,
              ];
              
              context.report({
                node,
                loc: {
                  start: { line: i + 1, column: 0 },
                  end: { line: i + 1, column: currentIndent.length },
                },
                message: `Empty line not indented correctly. (expected ${desiredIndent.length} spaces, found ${currentIndent.length})`,
                fix(fixer) {
                  return fixer.replaceTextRange(range, desiredIndent);
                },
              });
            }
          } else if(bracketRE.exec(line)) {
            desiredIndent = currentIndent + padding;
          } else {
            desiredIndent = currentIndent;
          }
        }
      },
    };
  },
};
