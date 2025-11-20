const str = `
<div>
<button aria-label="Scroll to bottom">
</button>
</div>
`;
console.log(str.replace(
              /<button\b[^>]*\baria-label="Scroll to bottom"[^>]*?>([\s\S]*?)<\/button>\n/g,
              "",
            ))
