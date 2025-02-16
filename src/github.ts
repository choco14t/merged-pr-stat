import { gql } from "graphql-request";
import { graphql } from "@octokit/graphql";
import { PullRequest } from "./entity";
import { parseISO } from "date-fns";

// GitHub.com https://api.github.com/graphql
// GitHub Enterprise https://<HOST>/api/graphql
const GITHUB_GRAPHQL_ENDPOINT = process.env.GITHUB_ENDPOINT || "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const graphQLClient = graphql.defaults({
  headers: {
    authorization: `Bearer ${GITHUB_TOKEN}`,
  },
  baseUrl: GITHUB_GRAPHQL_ENDPOINT,
});

export async function fetchAllMergedPullRequests(
  searchQuery: string,
  startDateString?: string,
  endDateString?: string
): Promise<PullRequest[]> {
  const startDate = startDateString ? parseISO(startDateString).toISOString() : "";
  const endDate = endDateString ? parseISO(endDateString).toISOString() : "";

  let q = `is:pr is:merged ${searchQuery}`;
  if (startDate !== "" || endDate !== "") {
    q += ` merged:${startDate}..${endDate}`;
  }

  return fetchAllPullRequestsByQuery(q);
}

interface PullRequestNode {
  title: string;
  author: {
    login: string;
  } | null;
  url: string;
  createdAt: string;
  mergedAt: string;
  additions: number;
  deletions: number;
  commits: {
    nodes: {
      commit: {
        authoredDate: string;
      };
    }[];
  };
  reviews: {
    nodes: {
      createdAt: string;
    }[];
  };
}

async function fetchAllPullRequestsByQuery(searchQuery: string): Promise<PullRequest[]> {
  const query = gql`
    query($after: String) {
      search(type: ISSUE, first: 100, query: "${searchQuery}", after: $after) {
        issueCount
        nodes {
          ... on PullRequest {
            title
            author {
              login
            }
            url
            createdAt
            mergedAt
            additions
            deletions
            # for lead time
            commits(first:1) {
              nodes {
                commit {
                  authoredDate
                }
              }
            }
            # for time to merge from review
            reviews(first:1) {
              nodes {
                ... on PullRequestReview {
                  createdAt
                }
              }
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
    }
  `;

  let after: string | undefined;
  let prs: PullRequest[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await graphQLClient(query, { after }) as any;
    prs = prs.concat(
      data.search.nodes.map(
        (p: PullRequestNode) =>
          new PullRequest(
            p.title,
            p.author ? p.author.login : undefined,
            p.url,
            p.createdAt,
            p.mergedAt,
            p.additions,
            p.deletions,
            p.commits.nodes[0].commit.authoredDate,
            p.reviews.nodes[0] ? p.reviews.nodes[0].createdAt : undefined
          )
      )
    );

    if (!data.search.pageInfo.hasNextPage) break;

    after = data.search.pageInfo.endCursor;
  }

  return prs;
}
