import React, { useState } from "react";
import {
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { Close, RadioButton } from "@carbon/icons-react";
import { colors } from "../../constants/index";

interface LikertScaleResponsesProps {
  data: string[];
}

export const LikertScaleResponses = ({ data }: LikertScaleResponsesProps) => {
  const [responses, setResponses] = useState(data);

  return (
    <List className='w-full'>
      {responses.map((item) => (
        <ListItem
          key={item}
          className='flex items-center '
          secondaryAction={
            <IconButton
              edge='end'
              aria-label='delete'
              className='w-auto'
              onClick={() => {
                setResponses(responses.filter((i) => i !== item));
              }}
            >
              <Close />
            </IconButton>
          }
        >
          <ListItemAvatar
            sx={{ minWidth: "20px" }}
            className='flex items-center'
          >
            <RadioButton color={colors.primary.dark} />
          </ListItemAvatar>
          <ListItemText className='text-light ml-2' primary={item} />
        </ListItem>
      ))}
      <ListItem className='flex items-center justify-start'>
        <ListItemAvatar sx={{ minWidth: "20px" }} className='flex items-center'>
          <RadioButton
            className='flex items-center justify-start w-auto'
            color={colors.primary.dark}
          />
        </ListItemAvatar>
        <ListItemText>
          <p className='m-0 ml-2 text-light'>
            Add Option or
            <Button variant='text'>
              <Typography
                className={`text-primary capitalize text-lg	border-b border-primary`}
              >
                Add “Other”
              </Typography>
            </Button>
          </p>
        </ListItemText>
      </ListItem>
    </List>
  );
};
