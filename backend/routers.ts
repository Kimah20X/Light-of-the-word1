import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";
import { fetchApiBibleChapter, isApiBibleConfigured, validateApiBibleReference } from "./api-bible";

export const appRouter = router({
  // If you need socket.io, register its route in backend/_core/index.ts. API routes should start with '/api/' so the gateway routes them correctly.
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  bible: router({
    status: publicProcedure.query(() => ({
      provider: "API.Bible" as const,
      configured: isApiBibleConfigured(),
      bibleId: ENV.apiBibleBibleId || null,
      translation: isApiBibleConfigured() ? "Configured API.Bible translation" : null,
    })),
    chapter: publicProcedure
      .input(z.object({ book: z.string().min(1).max(40), chapter: z.number().int().positive() }))
      .query(({ input }) => {
        if (!validateApiBibleReference(input.book, input.chapter)) {
          throw new Error("Choose a valid Bible book and chapter.");
        }
        return fetchApiBibleChapter(input.book, input.chapter);
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
