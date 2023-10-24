import { Box, Typography } from "@mui/material";
import Image from "next/image";
//import { Button } from "components/layout";
//import { useRouter } from "next/router";
//import { useEffect, useState } from "react";

const PageNotFound = () => {
  // const { push, asPath } = useRouter();
  // const [hideButtons, setHideButtons] = useState(true);
  // useEffect(
  //   () => setHideButtons(asPath.startsWith("/survey/assessment")),
  //   [asPath]
  // );
  return (
    <>
      <Box className="flex flex-col h-screen justify-center items-center w-full text-light pl-2 pb-1">
        <Box className="w-2/3  border-secondary border-[0.5px] rounded-sm p-10">
          <Box className="text-center">
            <Image
              src="/media/images/404NotFound.png"
              width={"300px"}
              height="300px"
              alt="404 NOT FOUND"
            />
          </Box>
          <Box className="w-2/3 m-auto">
            <Typography className="text-dark   text-lg mb-4 font-bold century-gothic">
              Dear User,
            </Typography>
            <Typography className="text-dark mb-4  text-lg font-normal">
              Thank you for clicking on the link. We regret to inform you that
              the task associated with this link has already been completed. If
              you have any further questions or concerns, please do not hesitate
              to reach out to your HR Manager/Account admin.
            </Typography>
            <Typography className="text-dark   text-lg  font-bold century-gothic">
              Thank you.
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PageNotFound;
