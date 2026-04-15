const z = require("zod");
exports.messageSchema = z.object({
  body: z.object({
    content: z.string().max(500, "Content must be less than 500."),
  }),
});
