import { useRouter } from "next/router";

export default function CaretLeft() {
  const router = useRouter();

  return (
    <svg
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={() => router.back()}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.9999 0.292893C11.3904 0.683417 11.3904 1.31658 10.9999 1.70711L2.70703 10L10.9999 18.2929C11.3904 18.6834 11.3904 19.3166 10.9999 19.7071C10.6094 20.0976 9.97624 20.0976 9.58571 19.7071L1.29282 11.4142C0.511771 10.6332 0.511767 9.36684 1.29282 8.58579L9.58571 0.292893C9.97624 -0.0976311 10.6094 -0.0976311 10.9999 0.292893Z"
        fill="#303136"
      />
    </svg>
  );
}
