const DIRECTIVE =
  /^\s*(?:eslint-disable(?:-next-line|-line)?|eslint-enable|prettier-ignore|@ts-expect-error)\b/;

const noComments = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Ban comments other than lint, type, and formatter directives.' },
    schema: [],
    messages: {
      banned:
        'Comments are banned: agents copy them and use them to justify workarounds. ' +
        'Rename, extract, or type the code until it explains itself, and encode constraints as types, tests, or lint rules.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type !== 'Shebang' && !DIRECTIVE.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: 'banned' });
          }
        }
      },
    };
  },
};

export const localRules = {
  meta: { name: 'local' },
  rules: { 'no-comments': noComments },
};
