import Layout from "@/components/Layout";
import prisma from "@/lib/prisma";
import { HeaderUtil } from "@/utils/headers";
import {
  ArrowTrendingUpIcon,
  FireIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { HandThumbUpIcon as HandThumbUpIconFilled } from "@heroicons/react/24/solid";
import { GetServerSideProps } from "next";
import Link from "next/link";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { Routes } from "../../utils/Routes";
import { NextPageWithLayout } from "../_app";
import { useRouter } from "next/router";
import { DateUtil } from "@/utils/date";

type UiListStory = {
  id: string;
  title: string;
  cover: string | null;
  content: string;
  textModel: string;
  imageModel: string;
  shareUsername: string;
  sharedDate: string;
  likes: number;
  isLiked: boolean;
};

export const getServerSideProps: GetServerSideProps<{
  stories: UiListStory[];
}> = async ({ req, query }) => {
  const ip = HeaderUtil.getIpAddressNextRequest(req);
  const visitor =
    ip != null ? await prisma.visitor.findFirst({ where: { ip: ip } }) : null;
  const visitorId = visitor?.id;

  const rankType = query.rank;

  let orderBy: any;
  if (rankType === "fresh") {
    orderBy = {
      sharedAt: "desc",
    };
  } else {
    orderBy = [
      {
        likes: {
          _count: "desc",
        },
      },
      { sharedAt: "asc" },
    ];
  }

  const stories = await prisma.story.findMany({
    orderBy: orderBy,
    take: 50,
  });

  const uiStories: UiListStory[] = stories.map((item) => {
    return {
      id: item.id,
      title: item.title,
      cover: item.cover,
      content: item.content,
      textModel: item.textModel,
      imageModel: item.imageModel,
      shareUsername: item.shareUsername,
      sharedDate: DateUtil.getTimePassed(item.sharedAt),
      likes: item.likes.length,
      isLiked: item.likes.find((it) => it.id === visitorId) != null,
    };
  });

  return {
    props: { stories: uiStories },
  };
};

const Page: NextPageWithLayout<{ stories: UiListStory[] }> = (props) => {
  return <StoriesPage stories={props.stories} />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

type RankItem = {
  name: string;
  query: string;
  icon: React.ReactElement;
};

const RANK_ITEMS: RankItem[] = [
  {
    name: "Top",
    query: "rank=top",
    icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
  },
  {
    name: "Fresh",
    query: "rank=fresh",
    icon: <FireIcon className="w-5 h-5" />,
  },
];

const ITEM_BG_COLORS = [
  "bg-violet-100 dark:bg-violet-500/50",
  "bg-violet-100/80 dark:bg-violet-500/40",
  "bg-violet-100/60 dark:bg-violet-500/30",
  "bg-violet-100/40 dark:bg-violet-500/20",
  "bg-violet-100/20 dark:bg-violet-500/10",
];

function StoriesPage({ stories }: { stories: UiListStory[] }) {
  const router = useRouter();

  const [currStories, setCurrStories] = useState(stories);

  const [rankItem, setRankItem] = useState(RANK_ITEMS[0]);

  const markLiked = useCallback((id: string) => {
    setCurrStories((prev) => {
      const newList = Array.from(prev);
      const target = newList.find((item) => item.id === id);
      if (target != null) {
        target.isLiked = true;
        target.likes++;
      }
      return newList;
    });
  }, []);

  const markUnlike = useCallback((id: string) => {
    setCurrStories((prev) => {
      const newList = Array.from(prev);
      const target = newList.find((item) => item.id === id);
      if (target != null) {
        target.isLiked = false;
        target.likes = Math.max(0, target.likes - 1);
      }
      return newList;
    });
  }, []);

  const like = useCallback(
    (id: string) => {
      markLiked(id);

      fetch("/api/story/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      })
        .then(async (res) => {
          if (res.status != 200) {
            throw new Error(await res.text());
          }
          return res;
        })
        .then((res) => res.json())
        .then((res) => {
          if (res.ok !== true) {
            markUnlike(id);
          }
        })
        .catch((e) => {
          console.error("Failed to like story ", id, ",", e);
          markUnlike(id);
        });
    },
    [markLiked, markUnlike]
  );

  const unlike = useCallback(
    (id: string) => {
      markUnlike(id);

      fetch("/api/story/unlike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      })
        .then(async (res) => {
          if (res.status != 200) {
            throw new Error(await res.text());
          }
          return res;
        })
        .then((res) => res.json())
        .then((res) => {
          if (res.ok !== true) {
            markLiked(id);
          }
        })
        .catch((e) => {
          console.error("Failed to like story ", id, ",", e);
          markLiked(id);
        });
    },
    [markLiked, markUnlike]
  );

  useEffect(() => {
    const expectPathname = Routes.READ + "?" + rankItem.query;
    if (expectPathname !== router.pathname) {
      router.replace(expectPathname);
    }
  }, [rankItem.query, router.pathname]);

  useEffect(() => {
    setCurrStories(stories);
  }, [stories]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="my-4 flex">
        {RANK_ITEMS.map((item) => {
          const isCurrent = rankItem.query === item.query;
          return (
            <div
              key={item.query}
              className={
                "min-w-[56px] px-4 py-1 flex items-center text-center " +
                (isCurrent
                  ? "text-white bg-violet-500"
                  : "text-gray-900 dark:text-white hover:bg-violet-300 cursor-pointer")
              }
              onClick={() => {
                if (!isCurrent) {
                  setRankItem(item);
                }
              }}
            >
              <div className="mr-2">{item.icon}</div>
              <p>{item.name}</p>
            </div>
          );
        })}
      </div>

      {currStories.length === 0 && (
        <p className="p-8 text-2xl text-center text-gray-900 dark:text-white">
          Nothing here?!
        </p>
      )}

      <ul className="w-full max-w-4xl p-4">
        {currStories.map((item, idx) => {
          return (
            <li
              key={item.id}
              className={
                "w-full mb-4 p-4 transition hover:bg-violet-200 dark:hover:bg-violet-500/60 border dark:border-gray-600 " +
                (ITEM_BG_COLORS[idx] ?? "")
              }
            >
              <Link href={Routes.story(item.id)}>
                <div className="w-full flex">
                  {item.cover != null && (
                    <div className="mr-4 shrink-0">
                      <img
                        alt={item.title}
                        src={item.cover}
                        className="w-24 h-24 bg-gray-300 dark:bg-gray-600 object-cover"
                      />
                    </div>
                  )}

                  <div className="w-full overflow-x-hidden">
                    <div className="mb-2 text-xl font-bold">
                      <span className="mr-2 text-gray-600 dark:text-gray-300">
                        #{idx + 1}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>

                    <div className="mb-2 font-serif line-clamp-2 text-gray-900 dark:text-white">
                      {item.content.substring(0, 300)}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p className="truncate">
                        {item.sharedDate} | Shared by {item.shareUsername}
                      </p>
                    </div>

                    <div className="flex justify-end items-center">
                      <div
                        className="flex items-center hover:text-violet-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.isLiked) {
                            unlike(item.id);
                          } else {
                            like(item.id);
                          }
                        }}
                      >
                        <div className="p-1">
                          {item.isLiked && (
                            <HandThumbUpIconFilled className="w-5 h-5 text-violet-500" />
                          )}
                          {!item.isLiked && (
                            <HandThumbUpIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                          )}
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {item.likes}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
