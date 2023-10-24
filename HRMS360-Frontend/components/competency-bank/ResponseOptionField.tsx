import { Close, RadioButton } from "@carbon/icons-react";
import { IconButton, ListItem, ListItemAvatar } from "@mui/material";
import { colors } from "constants/theme";
import { useField } from "formik";
import { Input } from "..";

export const ResponseOptionField = ({
  index,
  isLikert,
  remove,
}: {
  isLikert?: boolean;
  index: number;
  remove: (index: number) => void;
}) => {
  const [options] = useField(`responses.${index}.score`);

  return (
    <ListItem
      className='flex w-full items-start px-0 pt-0'
      secondaryAction={
        index > 1 && (
          <IconButton
            onClick={() => remove(index)}
            edge='end'
            aria-label='delete'
            className='w-auto mt-8'
          >
            <Close />
          </IconButton>
        )
      }
    >
      <ListItemAvatar
        sx={{ minWidth: "20px" }}
        className='flex items-center mt-12'
      >
        <RadioButton
          color={`${colors.primary.dark}80`}
          size={20}
          className='mr-3'
        />
      </ListItemAvatar>
      <div className='w-full'>
        <Input
          sx={{ width: isLikert ? "60%" : "90%" }}
          name={`responses.${index}.label`}
          label='Label'
        />
        {isLikert && (
          <Input
            sx={{ width: "30%" }}
            className='ml-4'
            label='Score'
            type={"number"}
            error={options.value > 5}
            helperText={options.value > 5 && "Score must be less then 5"}
            onBlur={(e) => options.onBlur(e)}
            inputProps={{
              min: 1,
              max: 5,
            }}
            name={`responses.${index}.score`}
          />
        )}
      </div>
    </ListItem>
  );
};
