import { UpToTop } from "@carbon/icons-react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useState, useEffect, useRef } from "react";

export function ScrollToTop() {
  const topRef = useRef<HTMLDivElement>();
  const [hideButton, setHideButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset === 0) {
        setHideButton(true);
      } else {
        setHideButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (hideButton) {
    return null;
  }

  return (
    <>
      <Box ref={topRef} />
      <Tooltip title='Scroll to Top' arrow followCursor>
        <IconButton
          onClick={() =>
            topRef!.current!.scrollIntoView({
              behavior: "smooth",
            })
          }
          className='fixed bg-primary text-white bottom-9 right-9'
        >
          <UpToTop size='20' />
        </IconButton>
      </Tooltip>
    </>
  );
}
