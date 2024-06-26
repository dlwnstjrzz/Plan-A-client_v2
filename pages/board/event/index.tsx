/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import { AddIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";

import FreeBoardTab from "@/components/board/FreeBoardTabs";
import PostsList from "@/components/board/PostsList";
import { Carousel, Header, FAB, AppContainer } from "@/components/common";
import SearchModal from "@/components/common/SearchModal";
import Navbar from "@/components/layout/Navbar";
import { useDropdown } from "@/hooks/useDropdown";
import { searchFunctionFactory, testAutocompleteFunction } from "@/utils/utils";

import profileApis from "@/api/profile";
import postApis from "@/api/post";

function RecruitMain() {
  const router = useRouter();
  const testSearchFunction = searchFunctionFactory("채용");
  const ref = useRef<HTMLButtonElement>(null);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    async function getProfile() {
      const response = await profileApis.getProfile();
      setRole(response.data?.data.role);
    }
    getProfile();
  }, []);
  const [dropdown, toggle] = useDropdown({
    menus: role === "STUDENT" ? ["후기 쓰기"] : ["후기 쓰기", "모집글 쓰기"],
    xGap: -60, // 정렬 위치로 부터 x 거리
    yGap: 10, // 정렬 위치로 부터 y 거리
    hAlign: "left", // ref의 왼쪽에 정렬
    vAlign: "top", // ref 보다 위에 정렬
    onMenuClick: menu => {
      // menu = 인덱스 값 0 ~ 2
      menu
        ? router.push("/board/form?boardId=2&postType=RECRUITMENT")
        : handlePost();
      // 클릭시 닫기도 가능
      // toggle(false);});
    },
    ref,
  });
  const handlePost = async () => {
    const response = await postApis.checkAgree();
    if (response.data?.data) {
      router.push(`/board/form?boardId=2&postType=NORMAL`);
    } else {
      // 최초 1회 공지
      if (response.code === 401) {
        router.push("/login");
      } else {
        router.push("/board/initialNotice?boardId=2&postType=NORMAL");
      }
    }
  };
  return (
    <AppContainer margin>
      <Navbar currentTab="infoBoard" />
      <Header
        py={4}
        back
        title="이벤트"
        rightNode={
          <SearchModal
            autocompleteFunction={testAutocompleteFunction}
            searchFunction={testSearchFunction}
          />
        }
      />
      <PostsList boardName={"대외활동"} type="RECRUITMENT" />
      {/* <FreeBoardTab
        leftLabel="모집"
        rightLabel="후기"
        leftTab={<PostsList boardName={"대외활동"} type="RECRUITMENT" />}
        rightTab={<PostsList boardName={"대외활동"} />}
      ></FreeBoardTab> */}
      {role === "ADMIN" && (
        <FAB
          icon={<AddIcon boxSize={18} />}
          ref={ref}
          r={3}
          b={"80px"}
          onClick={() => toggle(true)}
        ></FAB>
      )}
      {dropdown}
    </AppContainer>
  );
}

export default RecruitMain;
