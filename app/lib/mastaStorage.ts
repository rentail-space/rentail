import type { MastraMessageContentV2 } from "@mastra/core/agent";
import type {
  MastraMessageV1,
  MastraMessageV2,
  StorageThreadType,
} from "@mastra/core/memory";
import type { ScoreRowData } from "@mastra/core/scores";
import {
  type EvalRow,
  MastraStorage,
  type PaginationInfo,
  type StorageGetMessagesArg,
  type StorageResourceType,
  type ThreadOrderBy,
  type ThreadSortDirection,
  type ThreadSortOptions,
  type WorkflowRun,
  type WorkflowRuns,
} from "@mastra/core/storage";
import type { Trace } from "@mastra/core/telemetry";
import type { StepResult, WorkflowRunState } from "@mastra/core/workflows";
import type { Chat, Messages, User } from "prisma/generated/client";
import type { Role } from "prisma/generated/enums";
import prisma from "./prisma";

export class CustomStorage extends MastraStorage {
  constructor() {
    super({ name: "prisma" });
  }

  async init() {}

  get supports() {
    return {
      selectByIncludeResourceScope: false,
      resourceWorkingMemory: true,
      hasColumn: false,
      createTable: false,
      deleteMessages: false,
      aiTracing: false,
      indexManagement: false,
    };
  }

  async createTable() {
    throw new Error("Not implemented");
  }

  async clearTable() {
    throw new Error("Not implemented");
  }

  async dropTable() {
    throw new Error("Not implemented");
  }

  async alterTable() {
    throw new Error("Not implemented");
  }

  async insert() {
    throw new Error("Not implemented");
  }

  async batchInsert() {
    throw new Error("Not implemented");
  }

  async load<R>(): Promise<R | null> {
    throw new Error("Not implemented");
  }

  async getThreadById({
    threadId,
  }: {
    threadId: string;
  }): Promise<StorageThreadType | null> {
    const chat = await prisma.chat.findUnique({
      where: { id: threadId },
    });
    return chat ? toThread(chat) : null;
  }

  async getThreadsByResourceId({
    resourceId,
    orderBy,
    sortDirection,
  }: {
    resourceId: string;
    orderBy: ThreadOrderBy;
    sortDirection: ThreadSortDirection;
  }): Promise<StorageThreadType[]> {
    const chats = await prisma.chat.findMany({
      where: { userId: resourceId },
      orderBy: toOrderBy(orderBy, sortDirection),
    });
    return chats.map((chat) => toThread(chat));
  }

  async saveThread({
    thread,
  }: {
    thread: StorageThreadType;
  }): Promise<StorageThreadType> {
    const update = {
      createdAt: thread.createdAt,
      metadata: thread.metadata ? JSON.stringify(thread.metadata) : undefined,
      title: thread.title ?? undefined,
      updatedAt: thread.updatedAt,
      userId: thread.resourceId,
    };
    const chat = await prisma.chat.upsert({
      create: { ...update, id: thread.id },
      update,
      where: { id: thread.id },
    });
    return toThread(chat);
  }

  async updateThread({
    id,
    title,
    metadata,
  }: {
    id: string;
    title: string;
    metadata: Record<string, unknown>;
  }): Promise<StorageThreadType> {
    const chat = await prisma.chat.update({
      where: { id },
      data: { title, metadata: JSON.stringify(metadata) },
    });
    return toThread(chat);
  }

  async deleteThread({ threadId }: { threadId: string }) {
    await prisma.chat.delete({ where: { id: threadId } });
  }

  getMessages({
    threadId,
    resourceId,
    selectBy,
    format,
  }: StorageGetMessagesArg & {
    format?: "v1" | undefined;
  }): Promise<MastraMessageV1[]>;

  getMessages({
    threadId,
    resourceId,
    selectBy,
    format,
  }: StorageGetMessagesArg & {
    format: "v2";
  }): Promise<MastraMessageV2[]>;

  async getMessages({
    threadId,
    resourceId,
    selectBy,
    format,
  }: StorageGetMessagesArg & {
    format?: "v1" | "v2";
  }): Promise<MastraMessageV1[] | MastraMessageV2[]> {
    const page = selectBy?.pagination?.page ?? 0;
    const perPage = selectBy?.pagination?.perPage ?? 10;
    const messages = await prisma.messages.findMany({
      where: { chatId: threadId, chat: { userId: resourceId } },
      skip: page * perPage,
      take: perPage,
    });
    return format === "v2"
      ? toMessages(messages, "v2")
      : toMessages(messages, "v1");
  }

  getMessagesById({
    messageIds,
    format,
  }: {
    messageIds: string[];
    format?: "v1";
  }): Promise<MastraMessageV1[]>;

  getMessagesById({
    messageIds,
    format,
  }: {
    messageIds: string[];
    format: "v2";
  }): Promise<MastraMessageV2[]>;

  async getMessagesById({
    messageIds,
    format,
  }: {
    messageIds: string[];
    format?: "v1" | "v2";
  }): Promise<MastraMessageV1[] | MastraMessageV2[]> {
    const messages = await prisma.messages.findMany({
      where: { id: { in: messageIds } },
    });
    return format === "v2"
      ? toMessages(messages, "v2")
      : toMessages(messages, "v1");
  }

  saveMessages(args: {
    messages: MastraMessageV1[];
    format?: "v1";
  }): Promise<MastraMessageV1[]>;

  saveMessages(args: {
    messages: MastraMessageV2[];
    format: "v2";
  }): Promise<MastraMessageV2[]>;

  async saveMessages(
    args:
      | {
          messages: MastraMessageV1[];
          format?: "v1";
        }
      | {
          messages: MastraMessageV2[];
          format: "v2";
        },
  ): Promise<MastraMessageV2[] | MastraMessageV1[]>;

  async saveMessages(
    args:
      | { messages: MastraMessageV1[]; format?: undefined | "v1" }
      | { messages: MastraMessageV2[]; format: "v2" },
  ): Promise<MastraMessageV2[] | MastraMessageV1[]> {
    const messages = await prisma.messages.createManyAndReturn({
      data: args.messages.map((message) => ({
        content: JSON.stringify(message.content),
        createdAt: message.createdAt,
        id: message.id,
        role: message.role as Role,
        type: message.type ?? "text",
        chatId: message.threadId as string,
      })),
      skipDuplicates: true,
    });
    return args.format === "v2"
      ? toMessages(messages, "v2")
      : toMessages(messages, "v1");
  }

  async updateMessages(args: {
    messages: (Partial<Omit<MastraMessageV2, "createdAt">> & {
      id: string;
      content?: {
        metadata?: MastraMessageContentV2["metadata"];
        content?: MastraMessageContentV2["content"];
      };
    })[];
  }): Promise<MastraMessageV2[]> {
    const messages = await prisma.messages.updateManyAndReturn({
      data: args.messages.map((message) => ({
        content: message.content ? JSON.stringify(message.content) : undefined,
        id: message.id,
        role: message.role as Role,
        type: message.type as MastraMessageV2["type"],
        chatId: message.threadId as string,
      })),
    });
    return toMessages(messages, "v2");
  }

  async getTraces(/*args: StorageGetTracesArg*/): Promise<Trace[]> {
    throw new Error("Not implemented");
  }

  async getTracesPaginated(/*args: StorageGetTracesPaginatedArg*/): Promise<
    PaginationInfo & {
      traces: Trace[];
    }
  > {
    throw new Error("Not implemented");
  }

  async updateWorkflowResults(
    /*{
    workflowName,
    runId,
    stepId,
    result,
    runtimeContext,
  }: {
    workflowName: string;
    runId: string;
    stepId: string;
    result: StepResult<string, string, string, string>;
    runtimeContext: RuntimeContext;
  }*/
  ): Promise<Record<string, StepResult<string, string, string, string>>> {
    throw new Error("Not implemented");
  }

  async updateWorkflowState(
    /*{
    workflowName,
    runId,
    opts,
  }: {
    workflowName: string;
    runId: string;
    opts: {
      status: string;
      result?: StepResult<string, string, string, string>;
      error?: string;
      suspendedPaths?: Record<string, number[]>;
      waitingPaths?: Record<string, number[]>;
    };
  }*/
  ): Promise<WorkflowRunState | undefined> {
    throw new Error("Not implemented");
  }

  async getScoreById(/*{ id }: { id: string }*/): Promise<ScoreRowData | null> {
    throw new Error("Not implemented");
  }

  async saveScore(
    /*
    score: ValidatedSaveScorePayload,
  }*/
  ): Promise<{ score: ScoreRowData }> {
    throw new Error("Not implemented");
  }
  async getScoresByScorerId(
    /*{
    scorerId,
    pagination,
    entityId,
    entityType,
    source,
  }: {
    scorerId: string;
    pagination: StoragePagination;
    entityId?: string;
    entityType?: string;
    source?: ScoringSource;
  }*/
  ): Promise<{ pagination: PaginationInfo; scores: ScoreRowData[] }> {
    throw new Error("Not implemented");
  }

  async getScoresByRunId(
    /*{
    runId,
    pagination,
  }: {
    runId: string;
    pagination: StoragePagination;
  }*/
  ): Promise<{ pagination: PaginationInfo; scores: ScoreRowData[] }> {
    throw new Error("Not implemented");
  }

  async getScoresByEntityId(
    /*{
    entityId,
    entityType,
    pagination,
  }: {
    pagination: StoragePagination;
    entityId: string;
    entityType: string;
  }*/
  ): Promise<{ pagination: PaginationInfo; scores: ScoreRowData[] }> {
    throw new Error("Not implemented");
  }

  async getEvals(
    /*
    options: { agentName?: string; type?: "test" | "live" } & PaginationArgs,
  }*/
  ): Promise<PaginationInfo & { evals: EvalRow[] }> {
    throw new Error("Not implemented");
  }
  async getEvalsByAgentName(
    /*
    agentName: string,
    type?: "test" | "live",
  }*/
  ): Promise<EvalRow[]> {
    throw new Error("Not implemented");
  }

  async getWorkflowRuns(
    /*args?: {
    workflowName?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    resourceId?: string;
  }*/
  ): Promise<WorkflowRuns> {
    throw new Error("Not implemented");
  }
  async getWorkflowRunById(
    /*args: {
    runId: string;
    workflowName?: string;
  }*/
  ): Promise<WorkflowRun | null> {
    throw new Error("Not implemented");
  }

  async getThreadsByResourceIdPaginated(
    args: {
      resourceId: string;
      page: number;
      perPage: number;
    } & ThreadSortOptions,
  ): Promise<PaginationInfo & { threads: StorageThreadType[] }> {
    const count = await prisma.chat.count({
      where: { userId: args.resourceId },
    });
    const chats = await prisma.chat.findMany({
      orderBy: toOrderBy(args.orderBy, args.sortDirection),
      skip: args.page * args.perPage,
      take: args.perPage,
      where: { userId: args.resourceId },
    });
    return {
      hasMore: count > (args.page + 1) * args.perPage,
      page: args.page,
      perPage: args.perPage,
      total: count,
      threads: chats.map((chat) => toThread(chat)),
    };
  }

  async getMessagesPaginated(
    args: StorageGetMessagesArg & { format?: "v1" | "v2" },
  ): Promise<
    PaginationInfo & { messages: MastraMessageV1[] | MastraMessageV2[] }
  > {
    const page = args.selectBy?.pagination?.page ?? 0;
    const perPage = args.selectBy?.pagination?.perPage ?? 10;
    const messages = await prisma.messages.findMany({
      where: { chatId: args.threadId, chat: { userId: args.resourceId } },
      skip: page * perPage,
      take: perPage,
    });
    const count = await prisma.messages.count({
      where: { chatId: args.threadId, chat: { userId: args.resourceId } },
    });
    return {
      hasMore: count > (page + 1) * perPage,
      page: page,
      perPage: perPage,
      total: count,
      messages:
        args.format === "v2"
          ? toMessages(messages, "v2")
          : toMessages(messages, "v1"),
    };
  }

  async persistWorkflowSnapshot(
    /*{
    workflowName,
    runId,
    resourceId,
    snapshot,
  }: {
    workflowName: string;
    runId: string;
    resourceId?: string;
    snapshot: WorkflowRunState;
  }*/
  ): Promise<void> {
    throw new Error("Not implemented");
  }

  async loadWorkflowSnapshot(
    /*{
    workflowName,
    runId,
  }: {
    workflowName: string;
    runId: string;
  }*/
  ): Promise<WorkflowRunState | null> {
    throw new Error("Not implemented");
  }

  async getResourceById({
    resourceId,
  }: {
    resourceId: string;
  }): Promise<StorageResourceType | null> {
    const user = await prisma.user.findUnique({
      where: { id: resourceId },
    });
    return user ? toResource(user) : null;
  }

  async saveResource({
    resource,
  }: {
    resource: StorageResourceType;
  }): Promise<StorageResourceType> {
    const update = {
      workingMemory: resource.workingMemory,
      metadata: resource.metadata
        ? JSON.stringify(resource.metadata)
        : undefined,
    };
    const user = await prisma.user.upsert({
      create: { ...update, id: resource.id, location: "" },
      update,
      where: { id: resource.id },
    });
    return toResource(user);
  }

  async updateResource({
    resourceId,
    workingMemory,
    metadata,
  }: {
    resourceId: string;
    workingMemory?: string;
    metadata?: Record<string, unknown>;
  }): Promise<StorageResourceType> {
    const user = await prisma.user.update({
      where: { id: resourceId },
      data: {
        workingMemory,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
    return toResource(user);
  }
}

function toMessages(messages: Messages[], format: "v1"): MastraMessageV1[];
function toMessages(messages: Messages[], format: "v2"): MastraMessageV2[];
function toMessages(
  messages: Messages[],
  format: "v1" | "v2",
): MastraMessageV1[] | MastraMessageV2[] {
  return format === "v2"
    ? messages.map((message) => ({
        content: message.content
          ? JSON.parse(message.content as string)
          : undefined,
        createdAt: message.createdAt,
        id: message.id,
        role: message.role as MastraMessageV2["role"],
        type: message.type as MastraMessageV2["type"],
        threadId: message.chatId,
      }))
    : messages.map((message) => ({
        content: message.content
          ? JSON.parse(message.content as string)
          : undefined,
        createdAt: message.createdAt,
        id: message.id,
        role: message.role as MastraMessageV1["role"],
        type: message.type as MastraMessageV1["type"],
        threadId: message.chatId,
      }));
}

function toThread(chat: Chat): StorageThreadType {
  return {
    createdAt: chat.createdAt,
    id: chat.id,
    metadata: JSON.parse(chat.metadata as string),
    resourceId: chat.userId,
    title: chat.title ?? undefined,
    updatedAt: chat.updatedAt,
  };
}

function toResource(user: User): StorageResourceType {
  return {
    id: user.id,
    workingMemory: user.workingMemory ?? undefined,
    metadata: user.metadata ? JSON.parse(user.metadata as string) : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toOrderBy(
  orderBy: ThreadOrderBy | undefined,
  sortDirection: ThreadSortDirection | undefined,
): { createdAt: "desc" | "asc" } | { updatedAt: "desc" | "asc" } {
  const sortOrder = sortDirection === "DESC" ? "desc" : "asc";
  return orderBy === "updatedAt"
    ? { updatedAt: sortOrder }
    : { createdAt: sortOrder };
}
