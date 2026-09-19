import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, applicationsTable } from "@workspace/db";
import {
  CreateApplicationBody,
  CreateApplicationResponse,
  DeleteApplicationParams,
  GetApplicationParams,
  GetApplicationResponse,
  GetDashboardSummaryResponse,
  ListApplicationsQueryParams,
  ListApplicationsResponse,
  UpdateApplicationBody,
  UpdateApplicationParams,
  UpdateApplicationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDateString = (value: Date | string | null | undefined) => {
  if (value == null) return value;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
};

router.get("/applications", async (req, res): Promise<void> => {
  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search } = parsed.data;
  const filters = [];
  if (status && status !== "All") filters.push(eq(applicationsTable.status, status));
  if (search) {
    filters.push(
      or(
        ilike(applicationsTable.company, `%${search}%`),
        ilike(applicationsTable.role, `%${search}%`),
        ilike(applicationsTable.location, `%${search}%`),
      ),
    );
  }

  const rows = await db
    .select()
    .from(applicationsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(applicationsTable.submittedAt), desc(applicationsTable.createdAt));

  res.json(ListApplicationsResponse.parse(rows));
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [application] = await db
    .insert(applicationsTable)
    .values({
      ...parsed.data,
      submittedAt: toDateString(parsed.data.submittedAt) as string,
      followUpAt: toDateString(parsed.data.followUpAt),
      link: parsed.data.link ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(CreateApplicationResponse.parse(application));
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [application] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json(GetApplicationResponse.parse(application));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [application] = await db
    .update(applicationsTable)
    .set({
      ...(parsed.data.company !== undefined ? { company: parsed.data.company } : {}),
      ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      ...(parsed.data.location !== undefined ? { location: parsed.data.location } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.submittedAt !== undefined
        ? { submittedAt: toDateString(parsed.data.submittedAt) as string }
        : {}),
      ...(parsed.data.followUpAt !== undefined
        ? { followUpAt: toDateString(parsed.data.followUpAt) }
        : {}),
      ...(parsed.data.link !== undefined ? { link: parsed.data.link ?? null } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json(UpdateApplicationResponse.parse(application));
});

router.delete("/applications/:id", async (req, res): Promise<void> => {
  const params = DeleteApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [application] = await db
    .delete(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id))
    .returning({ id: applicationsTable.id });

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.status(204).send();
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const applications = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.submittedAt), desc(applicationsTable.createdAt));
  const today = new Date().toISOString().slice(0, 10);
  const statusCounts = applications.reduce<Record<string, number>>((counts, application) => {
    counts[application.status] = (counts[application.status] ?? 0) + 1;
    return counts;
  }, {});

  const active = applications.filter(
    (application) => !["Rejected", "Withdrawn"].includes(application.status),
  ).length;
  const followUps = applications.filter(
    (application) =>
      application.followUpAt != null &&
      application.followUpAt <= today &&
      !["Rejected", "Withdrawn", "Offer"].includes(application.status),
  ).length;
  const interviews = applications.filter((application) => application.status === "Interviewing").length;
  const offers = applications.filter((application) => application.status === "Offer").length;

  res.json(
    GetDashboardSummaryResponse.parse({
      total: applications.length,
      active,
      followUps,
      interviews,
      offers,
      statusCounts,
      recentApplications: applications.slice(0, 5),
    }),
  );
});

export default router;