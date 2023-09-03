import { Key, useEffect, useState } from "react";

import { Box } from "@chakra-ui/react";
import { useRouter } from "next/router";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import boardApis from "@/api/board";
import { BoxButton, Carousel, Banner } from "@/components/common";
import { DeviderWave } from "@/components/icons";
import Layout from "@/components/layout/Layout";
import {
  HomeSettingList,
  HyperLinks,
  TextBanner,
  MainBoardStack,
  MainBoardTitle,
  MainBoardItem,
  MainBanner,
} from "@/components/main";
import useDrawer from "@/hooks/useDrawer";
import useSnackbar from "@/hooks/useSnackbar";
import formatDate from "@/utils/formatDate";
import certificationApis from "@/api/certification";
import postApis from "@/api/post";
import commentApis from "@/api/comment";

const props = {
  header: "홈 설정",
  subtitle: "보고싶은 게시판만 선택하고 정렬해 보세요.",
  children: (
    <HomeSettingList
      categoryList={[
        {
          content: "채용",
          id: "apple",
        },
        {
          content: "대외활동",
          id: "banana",
        },
        {
          content: "익명",
          id: "carrot",
        },
        {
          content: "동아리",
          id: "dog",
        },
      ]}
    />
  ),
  btnContent: "설정 완료",
};

type BoardType = {
  title: string;
  boards: any[];
  boardId: number;
};

type BoardListType = BoardType[];

export default function Main() {
  const [onOpen, ButtonDrawer] = useDrawer(props);
  const initialBoardList: BoardListType = [
    { title: "채용", boards: [], boardId: 1 },
    { title: "대외활동", boards: [], boardId: 2 },
    { title: "익명", boards: [], boardId: 4 },
    { title: "학교생활", boards: [], boardId: 5 },
  ];
  const [boardList, setBoardList] = useState<any>([]);
  const [alarmContent, setAlarmContent] = useState<string>("");
  const [isActivated, activateSnackbar, Snackbar] = useSnackbar(alarmContent);
  const [isCertificate, setIsCertificate] = useState<boolean>(false);
  useEffect(() => {
    async function fetchCertification() {
      const response = await certificationApis.getVerificationInfo();
      // const res = await postApis.initializePost({
      //   title: "ㅇ",
      //   content: "ㅇㅇ",
      //   boardId: 4,
      //   postType: "NORMAL",
      // });
      const res = await commentApis.getMyComment(1);
      console.log("verifs", res);
      if (!response.ok) {
      }
    }
    fetchCertification();
    certificationApis.getVerificationInfo();
    const isFirstCertificate = localStorage.getItem("certComplt");
    const isCertificate2 = localStorage.getItem("certComplt2");
    if (isCertificate2) {
      setIsCertificate(true);
    }
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    console.log("logg", isLoggedIn);
    if (isLoggedIn) {
      setAlarmContent(`${isLoggedIn}님! 인플리에 오신걸 환영합니다!`);
      activateSnackbar();
      localStorage.removeItem("isLoggedIn");
    }
    if (isFirstCertificate) {
      setAlarmContent("인증이 완료되었어요!");
      localStorage.removeItem("certComplt");
    }
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      if (true) {
        initialBoardList.forEach(el => {
          (async function () {
            const response = await boardApis.getBoardList(
              el.boardId,
              "NORMAL",
              1,
              "recent",
              5,
            );

            setBoardList((p: any) => {
              if (response.data) {
                return { ...p, [el.title]: response.data.data.posts };
              }
            });
          })();
        });
        // const response = await boardApis.checkBoardsExist(token);
      }
    };
    fetchBoards();
  }, []);

  const router = useRouter();

  return (
    <Layout>
      {isActivated && <Snackbar />}
      <Box bg={"#F7F8FA"} paddingX="4.2%">
        {!isCertificate && (
          <Banner
            mt={4}
            alert
            onClick={() => router.push("/certificationCenter")}
          >
            <Banner.AlertBanner
              notice={`지금은 일부 열람만 가능해요\n모든 기능을 사용하려면`}
              text="학생 인증하기"
            />
          </Banner>
        )}
        <Box height={"10px"} />
        <MainBanner />
        <Box marginTop="-55" zIndex="99">
          <DeviderWave />
        </Box>
        <Box mt={"32px"} />
        <HyperLinks />
        <Box mt={"48px"} />
        <Carousel>
          <img alt="banner" src="/assets/banner.png" />
          <img alt="banner" src="/assets/banner.png" />
          <img alt="banner" src="/assets/banner.png" />
        </Carousel>
        <Box mb={"48px"} />
        <TextBanner />
        {initialBoardList.map((el: any) => (
          <Box key={el} mb={5} mt={5}>
            <MainBoardTitle title={el.title} />
            <MainBoardStack>
              {boardList[el.title]?.map(
                (el2: {
                  postId: number;
                  commentCount: number | undefined;
                  likeCount: number | undefined;
                  viewCount: number;
                  title: string;
                  createdAt: string;
                }) => {
                  return (
                    <MainBoardItem
                      key={el2.postId}
                      comments={el2.commentCount}
                      likes={el2.likeCount}
                      date={formatDate(el2.createdAt)}
                      views={el2.viewCount}
                      title={el2.title}
                      onClick={() =>
                        router.push(`/posting/${el.boardId}/${el2.postId}`)
                      }
                    />
                  );
                },
              )}
            </MainBoardStack>
          </Box>
        ))}
        <Box mt={10} />
        {/* <Box mb={8} onClick={() => activateSnackbar()}>
          <BoxButton btnContent={"홈 설정"} type={"Filled"} onOpen={onOpen} />
        </Box> */}
        <ButtonDrawer />
      </Box>
    </Layout>
  );
}
