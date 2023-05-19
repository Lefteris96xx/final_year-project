import React, { useMemo, useState } from 'react';
import { Container, Grid, Header, Icon, Segment, Divider, Button, Form, Input, List } from 'semantic-ui-react';
import { Party } from '@daml/types';
import { Token } from '@daml.js/my-project-name1/lib';
import { User} from '@daml.js/my-project-name1/lib';
import { publicContext, userContext } from './App';
import UserList from './UserList';
import PartyListEdit from './PartyListEdit';
import MessageEdit from './MessageEdit';
import MessageList from './MessageList';


interface TokenData {
  tokenId: string;
  amount: number; 
  issuer: string;
  userAdmin: string;
  description: string;
  lastPrice: string; 
  currency: string;
  thumbnail: string;
  issued: string; 
}

const MainView: React.FC = () => {
  const username = userContext.useParty();
  const myUserResult = userContext.useStreamFetchByKeys(User.User, () => [username], [username]);
  const aliases = publicContext.useStreamQueries(User.Alias, () => [], []);
  const myUser = myUserResult.contracts[0]?.payload;
  const allUsers = userContext.useStreamQueries(User.User).contracts;

  const tokens = userContext.useStreamQueries(Token.Token).contracts;
  tokens.forEach((token) => console.log('Token owner', token.payload.owner));

  const followers = useMemo(
    () =>
      allUsers
        .map((user) => user.payload)
        .filter((user) => user.username !== username)
        .sort((x, y) => x.username.localeCompare(y.username)),
    [allUsers, username]
  );

  const followersWithTokens = useMemo(
    () =>
      followers.map((follower) => {
        const followerTokens = tokens.filter((token) => token.payload.owner === follower.username);
        console.log(`Filtered tokens for follower ${follower.username}:`, followerTokens);
        return { ...follower, tokens: followerTokens };
      }),
    [followers, tokens]
  );

  const partyToAlias = useMemo(
    () =>
      new Map<Party, string>(aliases.contracts.map(({ payload }) => [payload.username, payload.alias])),
    [aliases]
  );
  console.log(partyToAlias)

  const myUserName = aliases.loading ? 'loading ...' : partyToAlias.get(username) ?? username;

  const ledger = userContext.useLedger();

  const follow = async (userToFollow: Party): Promise<boolean> => {
    try {
      await ledger.exerciseByKey(User.User.Follow, username, { userToFollow });
      return true;
    } catch (error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
      return false;
    }
  };


  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState<string>('0'); 
  const [description, setDescription] = useState('');
  const [lastPrice, setLastPrice] = useState<string>('0'); 
  const [currency, setCurrency] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  

  const handleTokenCreate = async () => {
    const tokenData: TokenData = {
      tokenId,
      amount: Number(amount),
      issuer: username,
      userAdmin: username,
      description,
      lastPrice,
      currency,
      thumbnail,
      issued: new Date().toISOString(),
    };
  

    try {
      await ledger.exerciseByKey(User.User.UploadToken, username, { tokenData });

      setTokenId('');
      setAmount('0');
      setDescription('');
      setLastPrice('0');
      setCurrency('');
      setThumbnail('');
    } catch (error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
    }
  };
  
  return (
    <Container>
      <Grid centered columns={2}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as="h1" size="huge" color="blue" textAlign="center" style={{ padding: '1ex 0em 0ex 0em' }}>
            </Header>
  
            <Segment>
              <Header as="h2">
                <Icon name="user" />
                <Header.Content>
                  {myUserName ?? 'Loading...'}
                  <Header.Subheader>Users I'm following</Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <PartyListEdit parties={myUser?.following ?? []} partyToAlias={partyToAlias} onAddParty={follow} />
            </Segment>
            <Segment>
              <Header as="h2">
                <Icon name="globe" />
                <Header.Content>
                  The Network
                  <Header.Subheader>My followers and users they are following</Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <UserList users={followersWithTokens} partyToAlias={partyToAlias} onFollow={follow} />
            </Segment>
            <Segment>
              <Header as="h2">
                <Icon name="pencil square" />
                <Header.Content>
                  Messages
                  <Header.Subheader>Send a message to a follower</Header.Subheader>
                </Header.Content>
              </Header>
              <MessageEdit followers={followers.map((follower) => follower.username)} partyToAlias={partyToAlias} />
              <Divider />
              <MessageList partyToAlias={partyToAlias} />
            </Segment>
            <Segment>
              <Header as="h2">
                <Icon name="file alternate" />
                <Header.Content>
                  Create Token
                  <Header.Subheader>Create a new token</Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <Form>
                <Form.Field>
                  <label>Token ID</label>
                  <Input
                    placeholder="Token ID"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                  />
                </Form.Field>
  
                <Form.Field>
                  <label>Amount</label>
                  <Input
                    type="number"
                    placeholder="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Form.Field>
  
                <Form.Field>
                  <label>Description</label>
                  <Input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Form.Field>
  
                <Form.Field>
                  <label>Last Price</label>
                  <Input
                    type="text"
                    placeholder="Last Price"
                    value={lastPrice}
                    onChange={(e) => setLastPrice(e.target.value)}
                  />
                </Form.Field>
  
                <Form.Field>
                  <label>Currency</label>
                  <Input
                    placeholder="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </Form.Field>
  
                <Form.Field>
                  <label>Thumbnail</label>
                  <Input
                    placeholder="Thumbnail"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                  />
                </Form.Field> 
  
                <Button primary onClick={handleTokenCreate}>
                  Create
                </Button>
              </Form>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Segment>
      <Header as="h2">
          <Icon name="file alternate" />
          <Header.Content>
              My Tokens
              <Header.Subheader>Here are the tokens you've created, and available for offer </Header.Subheader>
          </Header.Content>
      </Header>
      <Divider />
      <List>
        {tokens.map(token => (
          <List.Item key={token.contractId}>
            <List.Content>
              <List.Header>Token ID: {token.payload.tokenData.tokenId}</List.Header>
              <List.Description>
                <p>Amount: {token.payload.tokenData.amount}</p>
                <p>Description: {token.payload.tokenData.description}</p>
                <p>Last Price: {token.payload.tokenData.lastPrice}</p>
                <p>Currency: {token.payload.tokenData.currency}</p>
                <p>Thumbnail: {token.payload.tokenData.thumbnail}</p>
              </List.Description>
            </List.Content>
          </List.Item>
        ))}
      </List>
    </Segment>
    <Segment>
  <Header as="h2">
    <Icon name="file alternate" />
    <Header.Content>
      Tokens from Users I'm Following
      <Header.Subheader>Here are the tokens from users I'm following</Header.Subheader>
    </Header.Content>
  </Header>
  <Divider />
  <List>
  {followersWithTokens.map(follower => (
    <List.Item key={follower.username}>
      <List.Header>{partyToAlias.get(follower.username) || follower.username}'s Tokens</List.Header>
      {follower.tokens.map(token => (
        <List.Content key={token.contractId}>
          <List.Header>Token ID: {token.payload.tokenData.tokenId}</List.Header>
          <List.Description>
            <p>Amount: {token.payload.tokenData.amount}</p>
            <p>Description: {token.payload.tokenData.description}</p>
            <p>Last Price: {token.payload.tokenData.lastPrice}</p>
            <p>Currency: {token.payload.tokenData.currency}</p>
            <p>Thumbnail: {token.payload.tokenData.thumbnail}</p>
          </List.Description>
        </List.Content>
      ))}
    </List.Item>
  ))}
</List>
</Segment>
</Container>
);

};   
        

export default MainView;

