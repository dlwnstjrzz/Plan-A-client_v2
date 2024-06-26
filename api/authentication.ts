import { methodFormat } from "@/utils/methodFormat";

import client from "./client";

const authApis = {
  validateEmail: methodFormat(async ({ email }) => {
    const response = await client.get(`signup/username/${email}`);
    return response;
  }),
  validateNickname: methodFormat(async ({ nickname }) => {
    const response = await client.get(`signup/nickname/${nickname}`);
    return response.data;
  }),
  studentSignup: methodFormat(async data => {
    await client.post(`signup/student`, data);
  }),
  companySignup: methodFormat(async data => {
    await client.post(`signup/company`, data);
  }),
  login: methodFormat(async (data, rememberMe) => {
    if (rememberMe) {
      const response = await client.post(`login?remember-me=true`, data);
      return response;
    } else {
      const response = await client.post(`login`, data);
      return response;
    }
  }),
  logout: methodFormat(async () => {
    const response = await client.post(`logout`);
    return response;
  }),
};

export default authApis;
