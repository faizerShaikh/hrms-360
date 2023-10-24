import { Button, Dialog } from "components/layout";

export const ImagePreviewDialog = ({
  croppedImage,
}: {
  croppedImage: string;
}) => {
  return (
    <Dialog
      maxWidth='sm'
      title={"Preview Image"}
      button={
        <Button
          className={`mt-4 capitalize xl:text-sm 2xl:text-semi-base`}
          variant={"contained"}
        >
          View Logo
        </Button>
      }
    >
      {({}) => (
        <>
          {/* eslint-disable-next-line */}
          <img src={croppedImage} width={150} height={50} alt='' />
        </>
      )}
    </Dialog>
  );
};
