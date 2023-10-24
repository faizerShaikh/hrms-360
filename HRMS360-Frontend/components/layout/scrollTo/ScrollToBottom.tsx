import { UpToTop } from "@carbon/icons-react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useState, useEffect, useRef } from "react";

export function ScrollToBottom() {
  const [hideButton, setHideButton] = useState(false);
  const bottomRef = useRef<HTMLDivElement>();

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
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
      <Tooltip title='Scroll to Bottom' arrow followCursor>
        <IconButton
          onClick={() =>
            bottomRef!.current!.scrollIntoView({
              behavior: "smooth",
            })
          }
          className='fixed bg-primary text-white bottom-9 right-9 '
        >
          <UpToTop size='20' className='rotate-180' />
        </IconButton>
      </Tooltip>
      <Box ref={bottomRef} />
    </>
  );
}
