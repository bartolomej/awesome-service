import { webEnv } from "../env";
import Link from "../models/link";
import List from "../models/list";
import Website from "../models/website";
import SearchLog from "../models/searchlog";
import Repository from "../models/repository";
import SearchLogRepository from "./searchlog";
import ListRepository from "./list";
import LinkRepository from "./link";
import * as typeorm from '../typeorm';
import { getRepository } from "typeorm";

describe('Link repository tests', function () {

  const linkRepository = LinkRepository();
  const listRepository = ListRepository();
  beforeAll(async () => {
    const env = webEnv();
    await typeorm.create({
      database: env.DB_NAME,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      host: env.DB_HOST
    });
  });
  afterAll(async () => {
    await typeorm.close();
  });
  afterEach(async () => {
    await removeAll();
  });

  it('should overwrite saved link model', async function () {
    const link0 = exampleLink({ user: 'user1', repo: 'repo1' });
    const link1 = exampleLink({ user: 'user2', repo: 'repo2' });
    const savedLink = await linkRepository.save(link0);
    const overwrittenLink = await linkRepository.save(link1);
    const fetchedLink = await linkRepository.get(link1.uid);

    expect(savedLink).toEqual(link0);
    expect(overwrittenLink).toEqual(link1);
    expect(fetchedLink).toEqual(link1);
  });

  it('should save and fetch link', async function () {
    const link = exampleLink({});

    const savedLink = await linkRepository.save(link);
    const fetchedLink = await linkRepository.get(link.uid);
    const allFromSource = await linkRepository.getFromSource('user.example');

    expect(savedLink).toEqual(link);
    expect(fetchedLink).toEqual(link);
    expect(allFromSource).toEqual([link]);
  });

  it('should count link records', async function () {
    expect(await linkRepository.getCount()).toBe(0);
    await linkRepository.save(new Link('https://example.com', 'example'));
    expect(await linkRepository.getCount()).toBe(1);
  });

  it('should fetch links with pagination', async function () {
    // insert 10 links in database
    await Promise.all(
      new Array(10).fill(0).map((_, i) => exampleLink({
        user: `user${i}`,
        repo: `repo${i}`
      }))
        .map(linkRepository.save)
    )

    // fetch items by pages
    const firstPage = await linkRepository.getAll(3, 0);
    const secondPage = await linkRepository.getAll(3, 1);

    expect(firstPage.length).toBe(3);
    expect(secondPage.length).toBe(3);
  });

  it('should fetch link with half empty and null page', async function () {
    await linkRepository.save(exampleLink({}));

    const firstPage = await linkRepository.getAll(2, 0);
    const secondPage = await linkRepository.getAll(2, 1);

    expect(firstPage.length).toBe(1);
    // expect empty page if no items to return
    expect(secondPage.length).toBe(0);
  });

  it('should fetch 2 random link objects', async function () {
    await linkRepository.save(exampleLink({}));
    const random = await linkRepository.getRandomObject(1);

    expect(random.length).toBe(1);
    expect(random[0].repository).not.toBeNull();
    expect(random[0].website).not.toBeNull();
  });

  it('should fetch links that belong to list', async function () {
    const sourceList = exampleList({ user: 'usr', repo: 'repo' });
    const link1 = exampleLink({ user: '1' });
    link1.source = sourceList.uid;
    const link2 = exampleLink({ user: '2' });
    link2.source = sourceList.uid;

    await listRepository.save(sourceList);
    await linkRepository.save(link1);
    await linkRepository.save(link2);
    // unrelated link
    await linkRepository.save(exampleLink({ user: '3' }));

    const links = await linkRepository.getAll(10, 0, sourceList.uid);
    const count = await linkRepository.getCount(sourceList.uid);

    expect(links.length).toBe(2);
    expect(count).toBe(2);
    expect(links[0]).toEqual(link1);
    expect(links[1]).toEqual(link2);
  });

  // TODO query returns empty result set ?!?!?!?!?!?
  it('should perform link fts based on a given query', async function () {
    const links = [
      exampleLink({
        user: 'bart',
        repo: 'repo1',
        description: 'Bart stands for Bartolomej...'
      }),
      exampleLink({
        user: 'bartek',
        repo: 'repo2',
        description: 'Bartek stands for idk...'
      }),
      exampleLink({
        user: 'tony',
        repo: 'repo3',
        description: 'Tony is a real name.'
      }),
    ]
    await Promise.all(links.map(linkRepository.save));

    const result = await linkRepository.search({ query: 'bartolomej' });

    expect(result).toEqual([links[0]]);
  });

  it('should count total search results', async function () {
    const result = await linkRepository.countSearchResults('hello')
    expect(result).toBe(0);
  });

  it('should fetch all distinct keywords', async function () {
    await Promise.all([
      exampleLink({ user: 'bart', repo: 'repo1', keywords: ['foo', 'bar'] }),
      exampleLink({ user: 'bartek', repo: 'repo2', keywords: ['foo', 'bar1'] }),
    ].map(linkRepository.save));

    const result = await linkRepository.getAllKeywords(2, 0);

    expect(result).toEqual(['foo', 'bar', 'bar1'])
  });

});

describe('List repository tests', function () {

  const listRepository = ListRepository();
  beforeAll(async () => {
    const env = webEnv();
    await typeorm.create({
      database: env.DB_NAME,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      host: env.DB_HOST
    });
  });
  afterAll(async () => {
    await typeorm.close();
  });
  afterEach(async () => {
    await removeAll();
  });

  it('should save and fetch list model', async function () {
    const list = exampleList({ user: 'bartolomej', repo: 'bookmarks' });

    const savedList = await listRepository.save(list);
    const fetchedList = await listRepository.get(list.uid);

    expect(savedList).toEqual(list);
    expect(fetchedList).toEqual(list);
  });

  it('should fetch list that doesnt exist', async function () {
    try {
      await listRepository.get('invalidUid');
      expect(1).toBe(2);
    } catch (e) {
      expect(e.message).toEqual('Entity not found')
    }
  });

  it('should perform list fts based on a given query', async function () {
    await Promise.all([
      exampleList({ user: 'bart' }),
      exampleList({ user: 'bartek' }),
      exampleList({ user: 'jim' }),
      exampleList({ user: 'tony' }),
    ].map(listRepository.save));

    const result = await listRepository.search({
      query: 'bart',
      limit: 4,
      page: 0
    });

    expect(result).toEqual([
      exampleList({ user: 'bart' })
    ]);
  });

  it('should fetch all topics', async function () {
    await Promise.all([
      exampleList({ user: 'bart', topics: ['test1', 'test2'] }),
      exampleList({ user: 'bartek', topics: ['test1', 'test3'] }),
    ].map(listRepository.save));

    const result = await listRepository.getAllTopics(0, 2);

    expect(result).toEqual(['test1', 'test2', 'test3'])
  });

  it('should count total search results', async function () {
    const result = await listRepository.countSearchResults('hello')
    expect(result).toBe(0);
  });

});

describe('SearchLog repository', function () {

  const searchLogRepository = SearchLogRepository();
  beforeAll(async () => {
    const env = webEnv();
    await typeorm.create({
      database: env.DB_NAME,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      host: env.DB_HOST
    });
  });
  afterAll(async () => {
    await typeorm.close();
  });
  beforeEach(async () => {
    await getRepository(SearchLog).query('DELETE FROM search_log WHERE 1=1');
  });

  it('should save log', async function () {
    const log = new SearchLog('test', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
    const saved = await searchLogRepository.save(log);
    const all = await searchLogRepository.getSortedByDate({});

    expect(all.length).toBe(1);
    expect(all[0]).toEqual(log);
    expect(saved).toEqual(log);
  });

  it('should count all searches', async function () {
    const logs = [
      new SearchLog('test', 'Mozilla/5.0 (Macintosh; ...'),
      new SearchLog('test2', 'Mozilla/5.0 (Macintosh; ...'),
    ];
    for (let l of logs) {
      await searchLogRepository.save(l);
    }

    const count = await searchLogRepository.getTotalCount();
    expect(count).toBe(2)
  });

  it('should group by query, order by popularity', async function () {
    const logs = [
      new SearchLog('test', 'Mozilla/5.0 (Macintosh; ...'),
      new SearchLog('test', 'Mozilla/5.0 (Macintosh; ...'),
      new SearchLog('test1', 'Mozilla/5.0 (Macintosh; ...'),
      new SearchLog('test1', 'Mozilla/5.0 (Macintosh; ...'),
      new SearchLog('test1', 'Mozilla/5.0 (Macintosh; ...'),
    ];
    for (let l of logs) {
      await searchLogRepository.save(l);
    }

    const stats = await searchLogRepository.getCountByQuery({});
    expect(stats).toEqual([
      { query: 'test1', count: 3 },
      { query: 'test', count: 2 },
    ])
  });

  it('should count all searches by date', async function () {
    const logs = await insertLogFor3days();

    const count = await searchLogRepository.getCountByDate({});
    expect(count).toEqual([
      { datetime: datetimeToDate(logs[0].datetime), count: 1 },
      { datetime: datetimeToDate(logs[1].datetime), count: 1 },
      { datetime: datetimeToDate(logs[2].datetime), count: 1 },
    ])
  });

  it('should count all searches from date', async function () {
    const logs = await insertLogFor3days();

    const fromDate = new Date(new Date().setHours(new Date().getHours() - 24));
    const count = await searchLogRepository.getCountByDate({ start: fromDate });

    expect(count).toEqual([
      { datetime: datetimeToDate(logs[0].datetime), count: 1 },
    ])
  });

  it('should count all searches to date', async function () {
    const logs = await insertLogFor3days();

    const toDate = new Date(new Date().setHours(new Date().getHours() - 24));
    const count = await searchLogRepository.getCountByDate({ end: toDate });

    expect(count).toEqual([
      { datetime: datetimeToDate(logs[1].datetime), count: 1 },
      { datetime: datetimeToDate(logs[2].datetime), count: 1 },
    ])
  });

  it('should count all searches from and to date', async function () {
    const logs = await insertLogFor3days();

    const fromDate = new Date(new Date().setHours(new Date().getHours() - 48));
    const toDate = new Date(new Date().setHours(new Date().getHours() - 24));
    const count = await searchLogRepository.getCountByDate({
      start: fromDate,
      end: toDate
    });

    expect(count).toEqual([
      { datetime: datetimeToDate(logs[1].datetime), count: 1 },
    ])
  });

  async function insertLogFor3days () {
    const logs = [
      new SearchLog('test', '', new Date()),
      new SearchLog('test2', '', new Date(new Date().setHours(new Date().getHours() - 24))),
      new SearchLog('test2', '', new Date(new Date().setHours(new Date().getHours() - 48))),
    ];
    for (let l of logs) {
      await searchLogRepository.save(l);
    }
    return logs;
  }

});

function datetimeToDate (d) {
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

function exampleLink ({
  user = 'user',
  repo = 'repo',
  stars = 12,
  forks = 23,
  description = null,
  topics = ['topic1', 'topics2'],
  keywords = ['key1', 'key2']
}) {
  const website = new Website(`https://example.com/${user}/${repo}`, 'example');
  website.keywords = keywords;
  website.description = description;
  const repository = new Repository(`https://github.com/${user}/${repo}`);
  repository.stars = stars;
  repository.forks = forks;
  repository.topics = topics;
  repository.description = description;
  return new Link(`https://github.com/${user}/${repo}`, 'user.example', website, repository);
}

function exampleList ({
  user = 'user',
  repo = 'repo',
  topics = ['test', 'test2'],
  description = 'This description describes this repository for testing purposes.'
}) {
  const listGithubRepo = new Repository(`https://github.com/${user}/${repo}`);
  listGithubRepo.stars = 12;
  listGithubRepo.forks = 23;
  listGithubRepo.topics = topics;
  listGithubRepo.description = description;
  return new List(`https://github.com/${user}/${repo}`, listGithubRepo);
}

async function removeAll () {
  await getRepository(Link).query('DELETE FROM link WHERE 1=1');
  await getRepository(List).query('DELETE FROM list WHERE 1=1');
  await getRepository(Repository).query('DELETE FROM repository WHERE 1=1');
  await getRepository(Website).query('DELETE FROM website WHERE 1=1');
}
