import React, { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useRecoilState, useResetRecoilState } from "recoil";

import postApis from "@/api/post";
import CreatePostButton from "@/components/board/CreatePostButton";
import FormTitle from "@/components/board/FormTitle";
import GeneralPostForm from "@/components/board/GeneralPostForm";
import RecruitingPostForm from "@/components/board/RecruitingPostForm";
import AppContainer from "@/components/common/AppContainer";
import CaretLeft from "@/components/icons/CaretLeft";
import useSnackbar from "@/hooks/useSnackbar";
import {
  IPostContent,
  postingContentAtom,
} from "@/state/atoms/posting/postingAtom";
import { postingContentAtomRecruit } from "@/state/atoms/posting/postingAtomRecruit";
import convertLinks from "@/utils/convertLinks";
import { Center, Spinner } from "@chakra-ui/react";

const pathByBoardId: { [key: number]: string } = {
  1: "/board/recruitment",
  2: "/board/event",
  3: "/board/club",
  4: "/board/anonymous",
  5: "/board/free",
};

// 생성 예시
// http://localhost:3000/board/form?boardId=4&postType=RECRUITMENT
// 수정 예시
// http://localhost:3000/board/form?postId=20
export default function PostingForm() {
  const params = useSearchParams();
  const router = useRouter();

  const [postType, setPostType] = useState("");
  const [boardId, setBoardId] = useState(0);
  const [postId, setPostId] = useState(0);
  const [isBtnActive, setBtnActive] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isActivated, activateSnackbar, Snackbar] = useSnackbar(
    `${
      boardId === 2 && postType === "NORMAL"
        ? "지식IN플리글"
        : PAGE_TITLE[postType]
    }을 작성하였습니다.`,
  );

  const [postContent, setPostContent] = useRecoilState(
    postingContentAtomRecruit,
  );
  const resetList = useResetRecoilState(postingContentAtomRecruit);

  function createPostSuccess() {
    // 글 작성 성공 처리
    activateSnackbar();
    setTimeout(() => {
      resetList();
      const pathName = pathByBoardId[boardId];
      if (boardId === 2 && postType === "NORMAL") {
        router.push("/knowledge");
      } else {
        router.push(pathName);
      }
    }, 1000);
  }

  function createPostFail() {
    setIsPosting(false);
    setBtnActive(true);
  }

  async function uploadImgsSuccess(postId: number) {
    // 이미지 업로드 성공 처리
    const imgUrls = await uploadImgStrToS3(postId);
    const newContent = replaceImgStrToS3(imgUrls);
    return newContent;
  }

  function updatePostContent(
    title: string,
    content: string,
    recruitment?: {
      companyName: string;
      endDate: string;
      startDate: string;
    },
  ) {
    if (recruitment) {
      const { companyName, endDate, startDate } = recruitment;
      setPostContent(d => ({
        ...d,
        title: title,
        content,
        recruitmentCompanyName: companyName,
        recruitmentEndDate: new Date(endDate),
        recruitmentStartDate: new Date(startDate),
      }));
    } else {
      setPostContent(d => ({ ...d, title: title, content }));
    }
  }

  // searchParams에서 query param 가져오기 비동기 업데이트를 위한 처리
  useEffect(() => {
    setPostType(params.get("postType") as string);
    setBoardId(parseInt(params.get("boardId") || "", 0));
    setPostId(parseInt(params.get("postId") || "", 0));
  }, [params]);

  useEffect(() => {
    if (postId && !postType && !boardId) {
      // postId가 있는 경우 조회
      readPost(postId).then(data => {
        const [title, content, postType, boardId, recruitment] = data;

        setPostType(postType);
        setBoardId(boardId);
        updatePostContent(title, content, recruitment);
      });
    }
  }, [postId]);

  return (
    <AppContainer>
      {isActivated && <Snackbar />}
      {isPosting && (
        <Center>
          <Spinner color="primary.normal" />
        </Center>
      )}
      <FormTitle
        title={
          boardId === 2 && postType === "NORMAL"
            ? "지식IN플리 글 쓰기"
            : `${PAGE_TITLE[postType]} 쓰기`
        }
        left={<CaretLeft />}
        right={
          <CreatePostButton
            isActive={isBtnActive}
            handleClick={() =>
              postId
                ? updatePost(
                    postType,
                    boardId,
                    postId,
                    postContent,
                    createPostSuccess,
                    createPostFail,
                    uploadImgsSuccess,
                    setBtnActive,
                    setIsPosting,
                  )
                : createPost(
                    boardId,
                    postType,
                    postContent,
                    createPostSuccess,
                    createPostFail,
                    uploadImgsSuccess,
                    setBtnActive,
                    setIsPosting,
                  )
            }
          />
        }
      />
      {postType === "RECRUITMENT" && (
        <RecruitingPostForm
          postId={postId}
          boardId={boardId}
          postContent={postContent}
          setPostContent={setPostContent}
          setBtnActive={setBtnActive}
        />
      )}
      {(postType === "NORMAL" || postType === "ANNOUNCEMENT") && (
        <GeneralPostForm
          postType={postType}
          postId={postId}
          boardId={boardId}
          postContent={postContent}
          setPostContent={setPostContent}
          setBtnActive={setBtnActive}
        />
      )}
    </AppContainer>
  );
}

const PAGE_TITLE: { [key: string]: string } = {
  RECRUITMENT: "모집글",
  NORMAL: "글",
  ANNOUNCEMENT: "공지글",
};

// img str 추출 함수
function extractImgBaseStr() {
  const innerHTML = document.querySelector("#contentEditable")!.innerHTML;
  const imgSrcPattern = /data:[^"]+/g; // 이미지 base64 추출
  const encodedImgLst = innerHTML.match(imgSrcPattern) || [];

  return encodedImgLst;
}

// 이미지 업로드 함수
async function uploadImgStrToS3(postId: number) {
  const imgStr = extractImgBaseStr();
  if (imgStr.length) {
    const res = await postApis.postImage({
      postId: postId,
      files: imgStr,
    });
    return res.data?.data.originalImageUrls;
  } else {
    return [];
  }
}

// 포스팅 업데이트 함수
async function updatePost(
  postType: string,
  boardId: number,
  postId: number,
  postContent: IPostContent,
  createPostSuccess: () => void,
  createPostFail: () => void,
  uploadImgsSuccess: (postId: number) => Promise<string>,
  setBtnActive: React.Dispatch<React.SetStateAction<boolean>>,
  setIsPosting: React.Dispatch<React.SetStateAction<boolean>>,
  // thumbnailUrl: string | null,
) {
  setBtnActive(false);
  setIsPosting(true);
  const _newContent = await uploadImgsSuccess(postId); // 이미지 처리
  const _postContent = filterRecruitment(postType, postContent);
  const newContent = await uploadImgsSuccess(postId);

  function extractFirstImage(htmlContent: string): string | null {
    const imgSrcPattern = /<img[^>]+src="([^">]+)"/;
    const match = htmlContent.match(imgSrcPattern);
    return match ? match[1] : null;
  }
  // Check if there are images in the content
  const hasImages = newContent.includes("<img");

  // Determine thumbnail
  const newThumbnail = hasImages ? extractFirstImage(newContent) : null;
  // const newThumbnail =
  //   extractImgBaseStr()[0] || _newContent.includes("<img") ? "" : null;
  // console.log(135, convertLinks(_newContent));
  // console.log(134, _postContent);
  const res = await postApis.updatePost({
    postType,
    body: {
      ..._postContent,
      // content: _newContent,
      content: convertLinks(_newContent),
      boardId,
      postId,
      thumbnailUrl: newThumbnail,
    },
  });
  if (res.ok) {
    setIsPosting(false);
    createPostSuccess();
  } else {
    alert(res.response.data.validation.content);
    createPostFail();
  }
}

// img blob string을 s3 이미지 링크로 replace 하는 함수
function replaceImgStrToS3(imgUrls: string[]) {
  let newInnerHTML = document.querySelector("#contentEditable")!.innerHTML;
  const encodedImgLst = extractImgBaseStr();
  for (let i = 0; i < imgUrls.length; i++) {
    const replaceFrom = encodedImgLst[i];
    const replaceTo = imgUrls[i];
    newInnerHTML = newInnerHTML.replace(`${replaceFrom}`, replaceTo);
  }
  return newInnerHTML;
}

// 포스팅 읽기 함수
async function readPost(postId: number) {
  const res = await postApis.readPost({ postId });
  const { title, content, postType, boardId, recruitment } = res.data!.data;

  return [title, content, postType, boardId, recruitment];
}

// 글 작성 전 하이퍼링크를 링크태그로 전환해줌
function filterRecruitment(postType: string, postContent: IPostContent) {
  const convertedContent = convertLinks(postContent.content);

  return postType === "RECRUITMENT"
    ? // ?
      //   postContent
      // : { title: postContent.title, content: postContent.content };
      { ...postContent, content: convertedContent }
    : { title: postContent.title, content: convertedContent };
}

// 포스팅 생성 함수
async function createPost(
  boardId: number,
  postType: string,
  postContent: IPostContent,
  createPostSuccess: () => void,
  createPostFail: () => void,
  uploadImgsSuccess: (postId: number) => Promise<string>,
  setBtnActive: React.Dispatch<React.SetStateAction<boolean>>,
  setIsPosting: React.Dispatch<React.SetStateAction<boolean>>,
) {
  setBtnActive(false);
  setIsPosting(true);
  const encodedImgLst = extractImgBaseStr();
  const _postContent = filterRecruitment(postType, postContent);

  if (!encodedImgLst.length) {
    // 이미지가 없는 글은 뼈대 생성과 글 생성이 동시에 이뤄집니다
    const res = await postApis.initializePost({
      postType,
      body: {
        ..._postContent,
        boardId,
        postType,
      },
    });
    if (res.ok) {
      setIsPosting(false);
      createPostSuccess();
    } else {
      console.log(111, res.response);
      if (res.response.status) {
        alert("학생 인증을 진행해주세요.");
      } else {
        alert(res.response.data.message);
      }
      createPostFail();
    }
  } else {
    // 이미지가 있는 글은 뼈대 생성과 글 생성이 별도로 이뤄집니다
    const res = await postApis.initializePost({
      postType,
      body: {
        ..._postContent,
        boardId,
        content: "임시 내용",
        postType,
      }, // 글 뼈대 초기 생성
    });
    if (res.ok) {
      const _postId = res.data!.data;
      await updatePost(
        postType,
        boardId,
        _postId,
        _postContent,
        createPostSuccess,
        createPostFail,
        uploadImgsSuccess,
        setBtnActive,
        setIsPosting,
      );
      await createPostSuccess();
    } else {
      // alert(res.response.data.validation.content);
      createPostFail();
    }
  }
}
