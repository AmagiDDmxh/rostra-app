import { AddIcon, DeleteIcon, TimeIcon } from "@chakra-ui/icons"
import { Alert, Box, Button, Center, Flex, FormControl, Heading, HStack, IconButton, Image, Input, InputGroup, InputLeftAddon, Select, Spacer } from "@chakra-ui/react"
import { RuleType } from "api/rule_setting"
import { Field, Form } from "formik"
import { useTranslation } from "next-i18next"
import { useRouter } from "next/router"
import React, { useState } from "react"
import DatePicker from "react-datepicker"
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import "react-datepicker/dist/react-datepicker.css"


export default function RuleAction({ info }: { info: RuleType }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [startDate, setStartDate] = useState(new Date(info.action.start_time))
  const [endDate, setEndDate] = useState(new Date(info.action.end_time))
  const [withList, setWithList] = useState([] as string[])
  const [withListId, setWithListId] = useState(1)
  const { action: rule_action } = info

  const handleClick = () => {
    router.push({
      pathname: `/mynfts/1`,
    })
  }
  const withListClick = () => {
    const list = withList
    console.log("list", list)
    list.push('')
    console.log("list", list)
    setWithList(list)
    setWithListId(list.length)
    return list
  }


  const submitContact = async (event: any) => {
    event.preventDefault()
    const github = event.target.github.value
    const twitter = event.target.twitter.value
    const discord = event.target.discord.value

    const url = event.target.url.value
    const with1 = event.target.with1.value
    const of1 = event.target.of1.value

    rule_action.type = github ? github : twitter ? twitter : discord ? discord : rule_action.type
    rule_action.url = url ?? rule_action.url;

    (with1 && of1) ?? rule_action.condition.push({ "with": with1, "of": of1 })
    rule_action.start_time = startDate
    rule_action.end_time = endDate
  }

  console.log("withList", withList)
  return (
    <>
      <form id='formAction' onSubmit={submitContact}>
        <br />
        <HStack spacing='2px' width="60%">
          <Image
            boxSize='30px'
            bg='white'
            color='white'
            src='/image/github64.png' />
          <Select id='github' defaultValue={'github'} placeholder='Github' size='lg' fontSize='xl' width="100%" border='0px'>
            <option value='discussion'>Comment on this discussion</option>
            <option value='commit'>Creat a commit</option>
            <option value='project'>Star this project</option>
          </Select>
          <Box p={3} />
          <Image
            boxSize='30px'
            bg='white'
            color='black'
            src='/image/twitter.png' />
          <Select value="" id='twitter' placeholder='twitter' size='lg' fontSize='xl' width="100%" border='0px'>
            <option value='Tweet'>Tweet</option>
            <option value='Retweet'>Retweet</option>
            <option value='Follow'>Follow</option>
            <option value='Hastag'>Hastag</option>
          </Select>

          <Box p={3} />
          <Image
            boxSize='30px'
            bg='white'
            color='black'
            src='/image/discord.svg' />
          <Select id='discord' placeholder='Discord' size='lg' fontSize='xl' width="100%" border='0px'>
            <option value='Join'>Join a server</option>
            <option value='Send'>Send message on a server</option>
          </Select>
        </HStack>
        <br />
        <FormControl as='fieldset' border='1px' color='gray' borderRadius='lg' overflow='hidden' >
          <Flex bg='black' h='80px' alignContent='center'>
            <Box p={3} />
            <Center>
              <Image
                boxSize='30px'
                bg='block'
                src='/image/github_light64.png' />
            </Center>
            <Center>
              <Box p='4'>
                <Heading size='md' color='white'>Comment on this discussion</Heading>
              </Box>
            </Center>
            <Spacer />
            <Center>
              <DeleteIcon w={7} h={7} color='white'
                onClick={() => { alert('Delete') }} />
              <Box p='3' />
            </Center>
          </Flex>

          <br />
          <InputGroup size='lg'>
            <InputLeftAddon children='URL' bg="white" width='70px' color='black' border='0px' />
            <Input id='url' placeholder='input discussion url' defaultValue={rule_action.url} />
          </InputGroup>
          <br />
          <HStack spacing='2px' width="60%">
            <InputGroup size='lg'>
              <InputLeftAddon children='With' bg="white" width='70px' color='black' border='0px' />
              <Select id='with1' defaultValue={'Address'} placeholder='Address' size='lg' fontSize='xl' width="100%">
                <option value='Address'>Address</option>
                <option value='Keyword'>Keyword</option>
              </Select>
            </InputGroup>
            <InputGroup size='lg'>
              <InputLeftAddon children='of' bg="white" width='50px' color='black' border='0px' />
              <Select id='of1' placeholder='Nervos' defaultValue={'Nervos'} size='lg' fontSize='xl' width="100%">
                <option value='Nervos'>Nervos</option>
                <option value='Ethereum'>Ethereum</option>
              </Select>
            </InputGroup>
          </HStack>
          <br />
          <HStack spacing='2px' width="67%">
            <InputGroup size='lg'>
              <InputLeftAddon children='With' bg="white" width='70px' color='black' border='0px' />
              <Select defaultValue='Address' id='with2' placeholder='Address' size='lg' fontSize='xl' width="100%">
                <option value='Address'>Address</option>
                <option value='Keyword'>Keyword</option>
              </Select>
            </InputGroup>
            <InputGroup size='lg'>
              <InputLeftAddon children='of' bg="white" width='50px' color='black' border='0px' />
              <Input id='of2' defaultValue={'Nervos'} placeholder='GM' size='lg' fontSize='xl' width="100%" />
            </InputGroup>
            <AddIcon w={6} h={6} width='10%' onClick={() => withListClick()} />
          </HStack>
          {withList.map((data, index) => (
            <><br />
              <HStack spacing='2px' width="60%">
                <InputGroup size='lg'>
                  <InputLeftAddon children='With' bg="white" width='70px' color='black' border='0px' />
                  <Select defaultValue={'Address'} id='with-'{...index} placeholder='Address' size='lg' fontSize='xl' width="100%">
                    <option value='Address'>Address</option>
                    <option value='Keyword'>Keyword</option>
                  </Select>
                </InputGroup>
                <InputGroup size='lg'>
                  <InputLeftAddon children='of' bg="white" width='50px' color='black' border='0px' />
                  <Input id='of-'{...index} placeholder={data} size='lg' fontSize='xl' width="100%" />
                </InputGroup>
              </HStack>
            </>

          ))}
          <br />

          <HStack spacing='2px' width="60%">
            <InputGroup size='lg'>
              <InputLeftAddon children='With Duration' bg="white" width='145px' color='black' border='0px' />
              <IconButton
                colorScheme='white'
                color={'gray.300'}
                aria-label='Call Segun'
                size='lg'
                icon={<TimeIcon />} />
              <Center>
                <DatePicker id='start_time' selected={startDate}
                  onChange={(date: Date) => setStartDate(date)} />
              </Center>

            </InputGroup>
            <InputGroup size='lg'>
              <InputLeftAddon children=' - ' bg="white" width='50px' color='black' border='0px' />
              <Center>
                <DatePicker id='end_time' selected={endDate}
                  onChange={(date: Date) => setEndDate(date)} />
              </Center>
            </InputGroup>


          </HStack>
          <br />
          <HStack spacing='2px' width="60%">
            <Box p='2' />
            <Button variant='with-shadow' bg="#3399ff" color='white'
              size='lg'
              height='60px'
              type="submit"
              width='200px'>{t('Save')}</Button>
          </HStack>

          <br />
        </FormControl>
      </form>
    </>
  )
}
