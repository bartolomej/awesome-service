import { LinkRepositoryInt } from "./repos";
import Website from "../models/website";
import Link from "../models/link";
import Repository from "../models/repository";
import { ERROR_MSG_NOT_FOUND } from "../constants";

const { getRepository } = require('typeorm');
const utils = require('./utils');

const SEARCH_MODE = 'NATURAL LANGUAGE MODE';

export default function LinkRepository (): LinkRepositoryInt {

  // NOTICE: mysql full-text search might cause scaling issues
  // TRY OUT THESE OSS IF THAT HAPPENS:
  // https://github.com/meilisearch/MeiliSearch
  // https://github.com/valeriansaliou/sonic
  async function search ({ query, listUid, limit = 20, page = 0 }): Promise<Link[]> {
    const sqlQuery = getRepository(Link)
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.repository', 'r')
      .leftJoinAndSelect('link.website', 'w')
      .where(`
        MATCH (w.url, w.title, w.name, w.description, w.author, w.keywords)
        AGAINST ('${query}' IN ${SEARCH_MODE})
      `)
      .orWhere(`
        MATCH (r.url, r.homepage, r.description, r.topics)
        AGAINST ('${query}' IN ${SEARCH_MODE})
      `)
    if (listUid) {
      sqlQuery.andWhere(`link.source = :listUid`, { listUid });
    }
    return (await sqlQuery
        .skip(limit * page)
        .take(limit)
        .getMany()
    ).map(utils.deserializeLink);
  }

  async function countSearchResults (query: string, listUid: string) {
    const sqlQuery = getRepository(Link)
      .createQueryBuilder('link')
      .select('COUNT(link.uid)', 'count')
      .leftJoin('link.repository', 'r')
      .leftJoin('link.website', 'w')
      .where(`
        MATCH (w.url, w.title, w.name, w.description, w.author, w.keywords)
        AGAINST ('${query}' IN ${SEARCH_MODE})
      `)
      .orWhere(`
        MATCH (r.url, r.homepage, r.description, r.topics)
        AGAINST ('${query}' IN ${SEARCH_MODE})
      `)
    if (listUid) {
      sqlQuery.andWhere(`link.source = :listUid`, { listUid });
    }
    const result = await sqlQuery.execute()
    return parseInt(result[0].count);
  }

  async function save (link: Link): Promise<Link> {
    if (link.website) {
      await getRepository(Website)
        .save(utils.serializeWebsite(link.website))
        .catch(e => {
          if (/ER_DUP_ENTRY/.test(e.message)) {
            throw new Error(ERROR_MSG_NOT_FOUND)
          } else {
            throw e;
          }
        });
    }
    if (link.repository) {
      await getRepository(Repository)
        .save(utils.serializeRepo(link.repository));
    }
    return getRepository(Link).save(link);
  }

  async function get (uid: string): Promise<Link> {
    return utils.deserializeLink(
      await getRepository(Link)
        .createQueryBuilder('link')
        .leftJoinAndSelect('link.repository', 'repository')
        .leftJoinAndSelect('link.website', 'website')
        .where('link.uid = :uid', { uid })
        .getOne()
    );
  }

  async function getFromSource (source: string): Promise<Link[]> {
    return (await getRepository(Link)
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.repository', 'repository')
      .leftJoinAndSelect('link.website', 'website')
      .where('link.source = :source', { source })
      .getMany()).map(utils.deserializeLink)
  }

  async function getAll (limit: number, page: number, source: string): Promise<Link[]> {
    const query = getRepository(Link)
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.repository', 'r')
      .leftJoinAndSelect('link.website', 'w')
    if (source) {
      query.where('link.source = :source', { source })
    }
    query
      .skip(page * limit)
      .take(limit)
      .orderBy('w.url', 'ASC')
    return (await query.getMany()).map(utils.deserializeLink);
  }

  async function getCount (source: string): Promise<number> {
    const result = await getRepository(Link)
      .query(`SELECT COUNT(*) as c FROM link ${source ? `WHERE source = '${source}'` : ''}`);
    return parseInt(result[0].c);
  }

  async function getRandomObject (count: number): Promise<Array<Link>> {
    return (await getRepository(Link)
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.repository', 'repository')
      .leftJoinAndSelect('link.website', 'website')
      .take(count || 1)
      .orderBy('RAND()')
      .getMany()).map(utils.deserializeLink)
  }

  async function getAllKeywords (limit: number, page: number): Promise<string[]> {
    // split keywords into arrays
    // remove repeated keywords with set constructor
    // @ts-ignore
    return [...new Set((await getRepository(Website)
      .createQueryBuilder('w')
      .select('w.keywords')
      .distinct(true)
      .where('CHAR_LENGTH(w.keywords) > 1')
      .skip(page * limit)
      .take(limit)
      .getMany())
      .map(l => utils.split(l.keywords)).flat())];
  }

  async function exists (uid: string): Promise<boolean> {
    try {
      await get(uid);
      return true;
    } catch (e) {
      if (e.message === ERROR_MSG_NOT_FOUND) {
        return false;
      } else {
        throw e;
      }
    }
  }

  return {
    save,
    get,
    getFromSource,
    getCount,
    getAll,
    exists,
    getRandomObject,
    getAllKeywords,
    search,
    countSearchResults
  }
}
