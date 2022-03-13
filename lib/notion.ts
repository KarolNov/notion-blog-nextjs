import { Client } from "@notionhq/client";
import { ListBlockChildrenResponse, QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { assertEnvVariables } from "./env-util";
import { ValidatedPost, validatePostProperties } from "./validation";

assertEnvVariables("NOTION_TOKEN", "NOTION_DATABASE_ID");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export type Post = Extract<QueryDatabaseResponse["results"][number], { properties: any }>;
export const getDatabase = async (databaseId: string): Promise<ValidatedPost[]> => {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results.map(validatePostProperties) as ValidatedPost[];
};

export const getPage = async (pageId: string) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
};
export type Block = Extract<ListBlockChildrenResponse["results"][number], { has_children: boolean }>;
export const getBlocks = async (blockId: string) => {
  const blocks: Block[] = [];
  let cursor: string;
  while (true) {
    const { results, next_cursor } = await notion.blocks.children.list({
      start_cursor: cursor,
      block_id: blockId,
    });
    blocks.push(...results.filter((block) => "has_children" in block) as Block[]);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return blocks;
};
